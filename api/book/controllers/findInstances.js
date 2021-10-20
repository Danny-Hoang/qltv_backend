
const SqlString = require('sqlstring');
const { sanityArrayNum, sanityOrder, sanityString, escapeString, sanityNumber, dmyToYmD } = require('../../helpers')

const findInstances = async (ctx) => {

    const generateOrderByQuery = (colName, order) => {
        order = sanityOrder(order);
        console.log('colName:[' + colName + ']');
        if (!order) return '';

        if (['title', 'author', 'price', 'totalPage', 'code', 'publishYear', 'borrowCount', 'lastReturnDate', 'importDate',
            'lastBorrowDate', 'days_on_loan', 'availableStatus',
            'size', 'category', 'publisher'].includes(colName)) {
            return ` ORDER BY ${SqlString.escapeId(colName)} ${order} `
        }

        if (colName === 'barcode') {
            return ` ORDER BY bookID ${order}`
        }

        return '';
    }


    let { 
        categories, author, code, publishers, bookTitle, bookID, importDate, 
        days_on_loan, availableStatus,
        page = 1, pageSize = 15, 
        order, sort
    } = ctx.request.body;


    order = sanityOrder(order);
    code = sanityString(code);
    author = sanityString(author);
    categories = sanityArrayNum(categories);
    publishers = sanityArrayNum(publishers);


    let _page = isNaN(page) ? 1 : parseInt(page);
    let _pgSize = isNaN(pageSize) ? 10 : parseInt(pageSize);
    const off_set = (_page - 1) * _pgSize;

    const pagination = _pgSize > 0 ? `LIMIT ${off_set}, ${_pgSize}` : '';
    console.log(_pgSize)

    let importDateFilter = ``

    if (/^\d{2}-\d{2}-\d{4}to\d{2}-\d{2}-\d{4}$/.test(importDate)) {
        const arr = importDate.split('to');
        const startDate = dmyToYmD(arr[0], '-');
        const endDate = dmyToYmD(arr[1], '-');
        importDateFilter = `DATE(CONVERT_TZ(t.created_at, '+00:00','+07:00')) BETWEEN '${startDate}' AND '${endDate}'`;
    }
    console.log('importDate:' + importDate)

    console.log('------------------availableStatus:-------------:', availableStatus)
    let availableStatusFilter = ``;
    if(availableStatus === 'lost') {
        availableStatusFilter = `t.status = 200`
    } else if(availableStatus === 'due') {
        availableStatusFilter = `
            t.status = 1 AND x.instanceID IS NOT NULL AND x.lastReturnDate IS NULL AND (
                DATEDIFF(DATE(CONVERT_TZ(Now(), '+00:00','+07:00')), DATE(CONVERT_TZ(x.lastBorrowDate, '+00:00','+07:00'))) - x.maxDays = 0
            )
        `
    } else if(availableStatus === 'overdue') {
        availableStatusFilter = `
            t.status = 1 AND x.instanceID IS NOT NULL AND  x.lastReturnDate IS NULL AND (
                DATEDIFF(DATE(CONVERT_TZ(Now(), '+00:00','+07:00')), DATE(CONVERT_TZ(x.lastBorrowDate, '+00:00','+07:00'))) - x.maxDays > 0
            )
        `
    } else if(availableStatus === 'borrowing') {
        availableStatusFilter = `
            t.status = 1 AND x.instanceID IS NOT NULL AND x.lastReturnDate IS NULL
        `
    } else if(availableStatus === 'instock') {
        availableStatusFilter = `
            t.status = 1 AND (
                x.instanceID IS NULL OR x.lastReturnDate IS NOT NULL
            )
        `
    }



    const instanceIDPattern = /^(\d+)\.(\d+)$/;
    const isInstanceIDPattern = instanceIDPattern.test(bookTitle);

    let titleFilter = '';
    if (isInstanceIDPattern) {
        const [, bookID, index] = bookTitle.match(instanceIDPattern);
        if (bookID && index) {
            titleFilter = `(b.id = ${bookID} AND t.index=${index})`;
        }
    } else if (bookTitle && !isNaN(bookTitle)) {
        titleFilter = `b.id = ${bookTitle}`;
    } else {
        titleFilter = bookTitle ? `b.title LIKE ${sanityString(bookTitle)}` : '';
    }

    const bookIDFilter = bookID ? `b.id = ${sanityNumber(bookID)}` : ''
    let days_on_loanFilter = '';
    if (days_on_loan === '-1') {
        days_on_loanFilter = `x.lastReturnDate IS NOT NULL OR x.borrowCount = 0 OR ISNULL(x.borrowCount)`
    } else if (days_on_loan === 'dangmuon') {

        days_on_loanFilter = `(
            CASE WHEN x.lastReturnDate IS NOT NULL OR x.borrowCount = 0 OR ISNULL(x.borrowCount)
            THEN false
                ELSE DATEDIFF(DATE(CONVERT_TZ(Now(), '+00:00','+07:00')), DATE(CONVERT_TZ(x.lastBorrowDate, '+00:00','+07:00'))) > 0
            END
        )`
    }
    else if (days_on_loan && Number(days_on_loan)) {
        days_on_loanFilter = `(
            CASE WHEN x.lastReturnDate IS NOT NULL OR x.borrowCount = 0 OR ISNULL(x.borrowCount)
            THEN false
                ELSE DATEDIFF(DATE(CONVERT_TZ(Now(), '+00:00','+07:00')), DATE(CONVERT_TZ(x.lastBorrowDate, '+00:00','+07:00'))) = ${days_on_loan}
            END
        )`
    }

    // const titleFilter = title ? `
    //     MATCH (b.title) AGAINST (${SqlString.escape(title)} IN NATURAL LANGUAGE MODE) 
    // ` : ''
    const codeFilter = code ? `b.code LIKE ${code}` : '';
    const authorFilter = author ? `b.author LIKE ${author}` : ''

    const categoryFilter = categories && categories.length ? `c.id IN (${categories.join(',')})` : '';


    const publisherFilter = publishers && publishers.length ? `p.id IN (${publishers.join(',')})` : '';

    const bookActiveFilter = `b.active = TRUE AND t.active = TRUE`

    const finalFilter = [
        bookActiveFilter,
        titleFilter, codeFilter, authorFilter, categoryFilter, publisherFilter, bookIDFilter, 
        days_on_loanFilter, importDateFilter, availableStatusFilter
    ]
        .filter(e => e)
        .join(' AND ');

    const failSafe = finalFilter ? '' : '1';

    // -200: mất       -100: khả dụng,    -300: hỏng/thanh lý, 
    //    0: tới hạn, 
    //  > 0: quá hạn
    //  < 0: đang mượn

    const query1 = `

    SELECT t.id as instanceID,  t.index, t.importDate, x.lastBorrowDate, x.lastReturnDate, x.borrowCount, r.name as lastReader, r.id as lastReaderID, 
    (
        CASE WHEN x.lastReturnDate IS NOT NULL OR x.instanceID IS NULL THEN null
        ELSE r.id
        END
    ) as readerID,
    (
        CASE WHEN x.lastReturnDate IS NOT NULL OR x.instanceID IS NULL THEN null
        ELSE r.name
        END
    ) as reader,
        b.id as bookID, b.title as bookTitle, b.code, b.publishYear, b.author, b.price, b.size, b.totalPage, 
        p.name as publisher, c.name as category, c.id as categoryID, p.id as publisherID,
       
    (
        CASE WHEN x.lastReturnDate IS NOT NULL OR ISNULL(x.instanceID)
            THEN -1
            ELSE DATEDIFF(DATE(CONVERT_TZ(Now(), '+00:00','+07:00')), DATE(CONVERT_TZ(x.lastBorrowDate, '+00:00','+07:00')))
        END
    ) as days_on_loan,
    (
        IF(
            t.status = 1, 
            IF(
                x.lastReturnDate IS NOT NULL OR ISNULL(x.instanceID), 
                -100, 
                DATEDIFF(DATE(CONVERT_TZ(Now(), '+00:00','+07:00')), DATE(CONVERT_TZ(x.lastBorrowDate, '+00:00','+07:00'))) - x.maxDays
                   
            ), 
            IF(
                t.status = 200,
                -200,
                -300
            )
        )
            
    ) as availableStatus
    FROM instances t 
    LEFT JOIN 
    (
        SELECT a.instanceID, a.borrowCount, br.id as borrowID, bb.maxDays,br.date as lastBorrowDate, a.lastReturnDate

        FROM (
            SELECT bb.instance as instanceID, COUNT(*) as borrowCount,
                            CASE WHEN MAX(returnDate IS NULL) = 0 THEN MAX(returnDate) END AS lastReturnDate
                        FROM borrow_books bb
                
                        GROUP BY bb.instance
        )a
            INNER JOIN borrow_books bb
            ON a.instanceID = bb.instance AND (bb.returnDate = a.lastReturnDate OR bb.returnDate IS NULL)
            
            INNER JOIN borrows br 
                ON br.id = bb.borrow
            INNER JOIN readers r 
                ON r.id = br.reader
    ) x
        ON t.id = x.instanceID
    LEFT JOIN borrows br
        ON x.lastBorrowDate = br.date
    LEFT JOIN readers r 
        ON r.id = br.reader
    INNER JOIN books b 
        ON b.id = t.book
    LEFT JOIN categories c 
        ON b.category = c.id
    LEFT JOIN publishers p 
        ON p.id = b.publisher

        WHERE ${finalFilter} ${failSafe}

        ${generateOrderByQuery(sort, order)}
        ${pagination}
`
    console.log(query1);
    const res = await strapi.connections.default.raw(query1)


    const query2 = `
        SELECT COUNT(*) as total_items
        FROM instances t 
        LEFT JOIN 
        (
            SELECT a.instanceID, a.borrowCount, br.id as borrowID, bb.maxDays,br.date as lastBorrowDate, a.lastReturnDate
    
            FROM (
                SELECT bb.instance as instanceID, COUNT(*) as borrowCount,
                                CASE WHEN MAX(returnDate IS NULL) = 0 THEN MAX(returnDate) END AS lastReturnDate
                            FROM borrow_books bb
                    
                            GROUP BY bb.instance
            )a
                INNER JOIN borrow_books bb
                ON a.instanceID = bb.instance AND (bb.returnDate = a.lastReturnDate OR bb.returnDate IS NULL)
                
                INNER JOIN borrows br 
                    ON br.id = bb.borrow
                INNER JOIN readers r 
                    ON r.id = br.reader
        ) x
            ON t.id = x.instanceID
        LEFT JOIN borrows br
            ON x.lastBorrowDate = br.date
        LEFT JOIN readers r 
            ON r.id = br.reader
        INNER JOIN books b 
            ON b.id = t.book
        LEFT JOIN categories c 
            ON b.category = c.id
        LEFT JOIN publishers p 
            ON p.id = b.publisher
            
        WHERE ${finalFilter} ${failSafe}
    `

    const count = await strapi.connections.default.raw(query2)
    console.log(query2)

    let totalItem = 0;
    if(count[0][0] && count[0][0].total_items) {
        totalItem = count[0][0].total_items
    }
    ctx.send({
        count: parseInt(totalItem),
        data: res[0]
    });
}

module.exports = findInstances;