const SqlString = require('sqlstring');
const { sanityArrayNum, sanityOrder, sanityString, dmyToYmD } = require('../../helpers')

const BookStatus = {
    DANGMUON: 'dangmuon',
    TOI_HAN: 'toihan',
    QUA_HAN: 'quahan'
}

const getAllBorrowBooks = async (ctx) => {

    const generateOrderByQuery = (colName, order) => {
        order = sanityOrder(order);
        console.log('colName:[' + colName + ']');
        if (!order) return '';

        if (['bookID', 'bookTitle', 'category', 'phone', 'author', 'reader',
            'lop', 'type', 'borrowDate', 'borrowID', 'returnDate','expireDate', 'lastBorrowDate', 'lastReturnDate', 'lastReaderID', 'days_on_loan','availableStatus', 'available'
        ].includes(colName)) {
            return ` ORDER BY ${SqlString.escapeId(colName)} ${order} `
        }

        return '';
    }


    let { bookTitle, reader, availableStatus, author, publishers, categories, page = 1, pageSize = 15, borrowDate, returnDate, order, sort } = ctx.request.body.data;

    console.log('------------------availableStatus:-------------:', availableStatus)
    order = sanityOrder(order);
    author = sanityString(author);
    categories = sanityArrayNum(categories);
    publishers = sanityArrayNum(publishers);

    let borrowFilter = ``
    console.log('borrowDate', borrowDate)

    if (/^\d{2}-\d{2}-\d{4}to\d{2}-\d{2}-\d{4}$/.test(borrowDate)) {
        const arr = borrowDate.split('to');
        console.log(arr);
        const startDate = dmyToYmD(arr[0], '-');
        const endDate = dmyToYmD(arr[1], '-');
        borrowFilter = `DATE(CONVERT_TZ(br.date, '+00:00','+07:00')) BETWEEN '${startDate}' AND '${endDate}'`;
    }

    let availableStatusFilter = ``;
    if(availableStatus === 'lost') {
        availableStatusFilter = `s.status = 200`
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

    let returnDateFilter = ``;
    if (returnDate === 'chuatra') {
        returnDateFilter = `ISNULL(brb.returnDate)`
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(returnDate)) {
        const d = dmyToYmD(returnDate, '-');
        returnDateFilter = `DATE(CONVERT_TZ(brb.returnDate, '+00:00','+07:00')) = '${d}'`
    }




    let _page = isNaN(page) ? 1 : parseInt(page);
    let _pgSize = isNaN(pageSize) ? 10 : parseInt(pageSize);
    const off_set = (_page - 1) * _pgSize;


    // MATCH (b.title) AGAINST (${SqlString.escape(bookTitle)} IN NATURAL LANGUAGE MODE) 
    // OR MATCH (r.name) AGAINST (${SqlString.escape(bookTitle)} IN NATURAL LANGUAGE MODE)

    // const titleFilter = bookTitle ? `
    //     b.title LIKE ${sanityString(bookTitle)}
    // ` : ''

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

    let readerFilter = ``;

    if (isNaN(reader)) {
        readerFilter = reader ? `
            r.name LIKE ${sanityString(reader)}
        ` : ''

    } else {
        const readerID = Number(reader);
        readerFilter = readerID ? `
            r.id = ${readerID}
        ` : ''
    }
    const authorFilter = author ? `
        b.author LIKE ${author}
    ` : '';


    console.log('reader:' + reader)

    const categoryFilter = categories && categories.length ? `b.categoryID IN (${categories.join(',')})` : '';


    const publisherFilter = publishers && publishers.length ? `b.publisherID IN (${publishers.join(',')})` : '';




    const finalFilter = [
            titleFilter, readerFilter, authorFilter, categoryFilter, publisherFilter, 
            borrowFilter, returnDateFilter, availableStatusFilter
        ]
        .filter(e => e)
        .join(' AND ');


    const failSafe = finalFilter ? '' : '1';

    // (
    //     CASE WHEN x.lastReturnDate IS NOT NULL OR x.borrowCount = 0
    //         THEN -1
    //         ELSE DATEDIFF(DATE(CONVERT_TZ(CURDATE(), '+00:00','+07:00')), DATE(CONVERT_TZ(x.lastBorrowDate, '+00:00','+07:00')))
    //     END
    // ) as days_on_loan
    const query1 = `
        SELECT b.id as bookID, t.id as instanceID, b.title as bookTitle, b.author, c.name as category, p.name as publisher, t.index, r.name as reader, 
            r.id as readerID, r.phone, l.name as lop, r.active, r.type, br.id as borrowID, br.date as borrowDate, 
            brb.returnDate, brb.id as borrowBookID, brb.maxDays,
            x.borrowCount, x.lastReturnDate, x.lastBorrowDate, x.lastReader, x.lastReaderID, DATE_ADD(br.date, INTERVAL brb.maxDays DAY) as expireDate,
            t.status,
            (
                CASE WHEN ISNULL(brb.returnDate)
                    THEN DATEDIFF(DATE(CONVERT_TZ(Now(), '+00:00','+07:00')), DATE(CONVERT_TZ(br.date, '+00:00','+07:00')))
                    ELSE DATEDIFF(DATE(CONVERT_TZ(brb.returnDate, '+00:00','+07:00')), DATE(CONVERT_TZ(br.date, '+00:00','+07:00')))
                    END
            ) as days_on_loan,
            (
                IF(
                    t.status = 1, 
                    IF(
                        x.lastReturnDate IS NOT NULL, 
                        -100, 
                        IF(
                            x.maxDays IS NULL,
                            -100,
                            DATEDIFF(DATE(CONVERT_TZ(Now(), '+00:00','+07:00')), DATE(CONVERT_TZ(x.lastBorrowDate, '+00:00','+07:00'))) - x.maxDays
                        )
                           
                    ), 
                    IF(
                        t.status = 200,
                        -200,
                        -300
                    )
                )
                    
            ) as availableStatus
        FROM borrow_books brb

        INNER JOIN instances t 
            ON brb.instance = t.id
        LEFT JOIN 
        (
            SELECT a.instanceID, a.borrowCount, br.id as borrowID, bb.maxDays,br.date as lastBorrowDate, a.lastReturnDate,  r.id as lastReaderID, r.name as lastReader
	
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

        INNER JOIN books b 
            ON t.book = b.id 
        LEFT JOIN categories c 
            ON b.category = c.id
        LEFT JOIN publishers p
            ON b.publisher = p.id

        INNER JOIN borrows br
            ON brb.borrow = br.id
        LEFT JOIN readers r 
            ON r.id = br.reader
        LEFT JOIN lops l 
            ON r.lop = l.id
            
        WHERE ${finalFilter} ${failSafe}

        ${generateOrderByQuery(sort, order)}
        LIMIT ${off_set}, ${_pgSize}
    `;

    console.log(query1);

    const res = await strapi.connections.default.raw(query1);



    const query2 = `
        SELECT COUNT(*) as total_items

        FROM borrow_books brb
        INNER JOIN instances t 
            ON brb.instance = t.id
        INNER JOIN books b 
            ON t.book = b.id 

        LEFT JOIN 
        (
            SELECT bb.instance as instanceID, bb.maxDays, a.lastReturnDate, a.lastBorrowDate, a.borrowCount
            FROM borrow_books bb
            INNER JOIN (
                SELECT bb.instance as instanceID, bb.id,
                    COUNT(*) as borrowCount, MAX(br.date) as lastBorrowDate, 
                    case when MAX(returnDate IS NULL) = 0 THEN max(returnDate) END AS lastReturnDate
                FROM borrow_books bb
                INNER JOIN borrows br
                    ON bb.borrow = br.id
                GROUP BY bb.instance
            ) a
                ON bb.id = a.id AND
                (
                    (a.lastReturnDate IS NULL) OR  bb.returnDate = a.lastReturnDate
                )
        ) x
            ON t.id = x.instanceID
        LEFT JOIN categories c 
            ON b.category = c.id
        LEFT JOIN publishers p
            ON b.publisher = p.id

        LEFT JOIN borrows br
            ON brb.borrow = br.id
        LEFT JOIN readers r 
            ON r.id = br.reader
        LEFT JOIN lops l 
            ON r.lop = l.id
        
        WHERE ${finalFilter} ${failSafe}
    `


    const count = await strapi.connections.default.raw(query2)


    let totalItem = 0;
    if(count[0][0] && count[0][0].total_items) {
        totalItem = count[0][0].total_items
    }
    ctx.send({
        count: parseInt(totalItem),
        data: res[0]
    });
}

module.exports = getAllBorrowBooks;