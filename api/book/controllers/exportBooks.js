const SqlString = require('sqlstring');
const { sanityArrayNum, sanityOrder, sanityString, escapeString, dmyToYmD } = require('../../helpers')

const exportBooks = async (ctx, others) => {

    const generateOrderByQuery = (colName, order) => {
        order = sanityOrder(order);
        console.log('colName:[' + colName + ']');
        if (!order) return '';

        if (['title', 'id', 'author', 'price', 'totalPage', 'code', 'publishYear', 'size', 'quantity', 'updated_at', 'importDate', 'barcode'].includes(colName)) {
            return ` ORDER BY ${SqlString.escapeId(colName)} ${order} `
        }

        if (colName === 'category') {
            return ` ORDER BY c.name ${order}`
        }

        if (colName === 'publisher') {
            return ` ORDER BY p.name ${order}`
        }

        return '';
    }


    let { categories, author, code, publishers, title, importDate, order, sort } = ctx.request.body;
    console.log('categories',categories);


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
    const joinCategory = `LEFT JOIN categories c ON b.category = c.id`

    const publisherFilter = publishers && publishers.length ? `p.id IN (${publishers.join(',')})` : '';
    const joinPublisher = `LEFT JOIN publishers p on b.publisher = p.id`;

    const finalFilter = [titleFilter, codeFilter, authorFilter, categoryFilter, publisherFilter, importDateFilter]
        .filter(e => e)
        .join(' AND ');

    const failSafe = finalFilter ? '' : '1';

    const query1 = `
        SELECT  b.id as bookID, t.index, b.title as bookTitle, b.publishPlace, b.code, b.publisher as publisherID, COUNT(bb.instance) as borrowCount,
            p.name as publisher, b.publishYear, b.category as categoryID, 
            c.name as category, b.author, b.size, b.price, b.totalPage, b.updated_at, b.importDate, COUNT(t.book) as quantity  
        FROM books b 
        LEFT JOIN categories c 
            ON b.category = c.id
        LEFT JOIN publishers p 
            ON b.publisher = p.id
        LEFT JOIN instances t
            ON b.id = t.book
        LEFT JOIN borrow_books bb
            ON bb.instance = b.id
        
        WHERE ${finalFilter} ${failSafe}
        GROUP BY b.id
        ${generateOrderByQuery(sort, order)}
    `
    const res = await strapi.connections.default.raw(query1)

    ctx.send(res[0]);

}

module.exports = exportBooks;