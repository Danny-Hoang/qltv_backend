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
            'lop', 'type', 'borrowDate', 'borrowID', 'returnDate', 'lastBorrowDate', 'lastReturnDate', 'lastReaderID', 'days_on_loan', 'available'
        ].includes(colName)) {
            return ` ORDER BY ${SqlString.escapeId(colName)} ${order} `
        }

        return '';
    }


    let { bookTitle, reader, author, publishers, categories, page = 1, pageSize = 15, borrowDate, returnDate, order, sort } = ctx.request.body.data;


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
    ` : ''

    console.log('reader:' + reader)

    const categoryFilter = categories && categories.length ? `b.categoryID IN (${categories.join(',')})` : '';


    const publisherFilter = publishers && publishers.length ? `b.publisherID IN (${publishers.join(',')})` : '';




    const finalFilter = [titleFilter, readerFilter, authorFilter, categoryFilter, publisherFilter, borrowFilter, returnDateFilter]
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
            r.id as readerID, r.phone, l.name as lop, r.active, r.type, br.id as borrowID, br.date as borrowDate, brb.returnDate, brb.id as borrowBookID,
            x.borrowCount, x.lastReturnDate, x.lastBorrowDate, x.lastReader, x.lastReaderID,
            (
                CASE WHEN ISNULL(brb.returnDate)
                    THEN DATEDIFF(DATE(CONVERT_TZ(CURDATE(), '+00:00','+07:00')), DATE(CONVERT_TZ(br.date, '+00:00','+07:00')))
                    ELSE DATEDIFF(DATE(CONVERT_TZ(brb.returnDate, '+00:00','+07:00')), DATE(CONVERT_TZ(br.date, '+00:00','+07:00')))
                    END
            ) as days_on_loan,
            (
                CASE WHEN x.lastReturnDate IS NOT NULL OR x.borrowCount = 0
                    THEN -1
                    ELSE DATEDIFF(DATE(CONVERT_TZ(CURDATE(), '+00:00','+07:00')), DATE(CONVERT_TZ(x.lastBorrowDate, '+00:00','+07:00')))
                END
            ) as available
        FROM borrow_books brb

        INNER JOIN instances t 
            ON brb.instance = t.id
        LEFT JOIN (
            SELECT instance as instanceID, 
                COUNT(*) as borrowCount, MAX(bw.date) as lastBorrowDate, 
                CASE WHEN MAX(returnDate IS NULL) = 0 THEN max(returnDate) END AS lastReturnDate,
                r.name as lastReader, r.id as lastReaderID
            FROM borrow_books bb
            INNER JOIN borrows bw
                ON bb.borrow = bw.id
            INNER JOIN readers r
                ON bw.reader = r.id
            GROUP BY instance
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