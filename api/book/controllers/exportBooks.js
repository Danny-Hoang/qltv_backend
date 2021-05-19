const SqlString = require('sqlstring');
const { sanityArrayNum, sanityOrder, sanityString, escapeString, dmyToYmD } = require('../../helpers')

const exportBooks = async (ctx, others) => {

    const generateOrderByQuery = (colName, order) => {
        order = sanityOrder(order);
        console.log('colName:[' + colName + ']');
        if (!order) return '';

        if (['title', 'id', 'author', 'price', 'totalPage', 'code', 'publishYear', 'size', 'quantity', 
            'borrowingCount', 'instock',
            'updated_at', 'importDate', 'barcode'].includes(colName)) {
            return ` ORDER BY ${SqlString.escapeId(colName)} ${order} `
        }

        if (colName === 'category') {
            return ` ORDER BY c.name ${order}`
        }
        if (colName === 'borrowCount') {
            return ` ORDER BY x.borrowCount ${order}`
        }

        if (colName === 'publisher') {
            return ` ORDER BY p.name ${order}`
        }

        return '';
    }


    let { categories, author, code, publishers, title, importDate, order, sort } = ctx.request.body;


    order = sanityOrder(order);
    code = sanityString(code);
    author = sanityString(author);
    categories = sanityArrayNum(categories);
    publishers = sanityArrayNum(publishers);

    const bookID = Number(title) || 0;

    let titleFilter = ''
    if (bookID) {
        titleFilter = `b.id = ${bookID}`
    } else {
        titleFilter = title ? `b.title LIKE ${sanityString(title)}` : ''
    }

    let importDateFilter = ``

    if (/^\d{2}-\d{2}-\d{4}to\d{2}-\d{2}-\d{4}$/.test(importDate)) {
        const arr = importDate.split('to');
        const startDate = dmyToYmD(arr[0], '-');
        const endDate = dmyToYmD(arr[1], '-');
        importDateFilter = `DATE(CONVERT_TZ(b.importDate, '+00:00','+07:00')) BETWEEN '${startDate}' AND '${endDate}'`;
    }

    const codeFilter = code ? `b.code LIKE ${code}` : '';
    const authorFilter = author ? `b.author LIKE ${author}` : ''

    const categoryFilter = categories && categories.length ? `c.id IN (${categories.join(',')})` : '';

    const publisherFilter = publishers && publishers.length ? `p.id IN (${publishers.join(',')})` : '';

    const finalFilter = [titleFilter, codeFilter, authorFilter, categoryFilter, publisherFilter, importDateFilter]
        .filter(e => e)
        .join(' AND ');
    console.log('final filter:');
    console.log(finalFilter);

    const failSafe = finalFilter ? '' : '1';

    const query1 = `
        SELECT b.title as bookTitle, b.id,  SUM(IF(ISNULL(a.instanceID), 0, 1)) as quantity, b.publishPlace, b.code, b.publisher as publisherID, x.borrowCount,
                p.name as publisher, b.publishYear, b.category as categoryID, 
                c.name as category, b.author, b.size, b.price, b.totalPage, b.updated_at, b.importDate,
            SUM(IF(a.available OR ISNULL(a.instanceID), 0, 1)) as borrowingCount ,
            SUM(IF(a.available, 1, 0)) as instock
        FROM books b

        LEFT JOIN categories c 
            ON b.category = c.id
        LEFT JOIN publishers p 
            ON b.publisher = p.id
        LEFT JOIN 
        (
            SELECT t.id as instanceID, t.book as bookID, 
                IF(x.lastReturnDate IS NOT NULL OR x.borrowCount = 0 OR ISNULL(x.lastBorrowDate), true, false) as available
                
            FROM instances t 
            LEFT JOIN 
                (SELECT bb.instance as instanceID,  
                COUNT(*) as borrowCount, MAX(br.date) as lastBorrowDate, 
                case when MAX(returnDate IS NULL) = 0 THEN max(returnDate) END AS lastReturnDate
                FROM borrow_books bb
                INNER JOIN borrows br
                ON bb.borrow = br.id
                GROUP BY bb.instance
                )x
            ON t.id = x.instanceID


                
        ) a
            ON b.id = a.bookID
        LEFT JOIN (
            SELECT b.id, COUNT(b.id) as borrowCount from borrow_books bb 
            INNER JOIN borrows br
                ON br.id = bb.borrow
            LEFT JOIN instances t 
                ON t.id = bb.instance
            LEFT JOIN books b 
                ON b.id = t.book
            GROUP BY b.id
        ) x
            ON x.id = b.id
            WHERE ${finalFilter} ${failSafe}
        GROUP BY b.id
        ${generateOrderByQuery(sort, order)}
    `
    console.log(query1);
    const res = await strapi.connections.default.raw(query1)

    ctx.send({
        data: res[0]
    });


}

module.exports = exportBooks;