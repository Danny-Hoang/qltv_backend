
const SqlString = require('sqlstring');
const { sanityArrayNum, sanityOrder, sanityString, escapeString, sanityNumber, dmyToYmD } = require('../../helpers')

const exportInstances = async (ctx) => {

    const generateOrderByQuery = (colName, order) => {
        order = sanityOrder(order);
        console.log('colName:[' + colName + ']');
        if (!order) return '';

        if (['title', 'author', 'price', 'totalPage', 'code', 'publishYear', 'borrowCount', 'lastReturnDate',
            'lastBorrowDate', 'days_on_loan',
            'size', 'category', 'publisher'].includes(colName)) {
            return ` ORDER BY ${SqlString.escapeId(colName)} ${order} `
        }

        if (colName === 'barcode') {
            return ` ORDER BY bookID ${order}`
        }

        return '';
    }


    let { categories, author, code, publishers, bookTitle, bookID, importDate, days_on_loan, order, sort } = ctx.request.body;


    order = sanityOrder(order);
    code = sanityString(code);
    author = sanityString(author);
    categories = sanityArrayNum(categories);
    publishers = sanityArrayNum(publishers);

    let importDateFilter = ``

    if (/^\d{2}-\d{2}-\d{4}to\d{2}-\d{2}-\d{4}$/.test(importDate)) {
        const arr = importDate.split('to');
        const startDate = dmyToYmD(arr[0], '-');
        const endDate = dmyToYmD(arr[1], '-');
        importDateFilter = `DATE(CONVERT_TZ(t.created_at, '+00:00','+07:00')) BETWEEN '${startDate}' AND '${endDate}'`;
    }
    console.log('importDate:' + importDate)


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
                ELSE DATEDIFF(DATE(CONVERT_TZ(CURDATE(), '+00:00','+07:00')), DATE(CONVERT_TZ(x.lastBorrowDate, '+00:00','+07:00'))) > 0
            END
        )`
    }
    else if (days_on_loan && Number(days_on_loan)) {
        days_on_loanFilter = `(
            CASE WHEN x.lastReturnDate IS NOT NULL OR x.borrowCount = 0 OR ISNULL(x.borrowCount)
            THEN false
                ELSE DATEDIFF(DATE(CONVERT_TZ(CURDATE(), '+00:00','+07:00')), DATE(CONVERT_TZ(x.lastBorrowDate, '+00:00','+07:00'))) = ${days_on_loan}
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


    const finalFilter = [titleFilter, codeFilter, authorFilter, categoryFilter, publisherFilter, bookIDFilter, days_on_loanFilter, importDateFilter]
        .filter(e => e)
        .join(' AND ');

    const failSafe = finalFilter ? '' : '1';

    const query1 = `

    SELECT t.id as instanceID,  t.index, x.lastBorrowDate, x.lastReturnDate, x.borrowCount, r.name as lastReader, r.id as lastReaderID, 
    (
        CASE WHEN x.lastReturnDate IS NOT NULL OR x.borrowCount = 0 THEN null
        ELSE r.id
        END
    ) as readerID,
    (
        CASE WHEN x.lastReturnDate IS NOT NULL OR x.borrowCount = 0 THEN null
        ELSE r.name
        END
    ) as reader,
        b.id as bookID, b.title as bookTitle, b.code, b.publishYear, b.author, b.price, b.size, b.totalPage, 
        p.name as publisher, c.name as category, c.id as categoryID, p.id as publisherID,
       
    (
        CASE WHEN x.lastReturnDate IS NOT NULL OR x.borrowCount = 0
            THEN -1
            ELSE DATEDIFF(DATE(CONVERT_TZ(CURDATE(), '+00:00','+07:00')), DATE(CONVERT_TZ(x.lastBorrowDate, '+00:00','+07:00')))
        END
    ) as days_on_loan
    FROM instances t 
    LEFT JOIN 
    (SELECT bb.instance as instanceID,  
        COUNT(*) as borrowCount, MAX(br.date) as lastBorrowDate, case when MAX(returnDate IS NULL) = 0 THEN max(returnDate) END AS lastReturnDate
        FROM borrow_books bb
        INNER JOIN borrows br
            ON bb.borrow = br.id
        GROUP BY bb.instance
    )x
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
`
    console.log(query1);
    const res = await strapi.connections.default.raw(query1)


    ctx.send(res[0]);
}

module.exports = exportInstances;