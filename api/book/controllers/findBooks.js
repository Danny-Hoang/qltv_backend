const SqlString = require('sqlstring');
const  { sanityArrayNum, sanityOrder, sanityString, escapeString } = require('../../helpers')

const findBooks = async (ctx, others) => {

    const generateOrderByQuery = (colName, order) => {
        order = sanityOrder(order);
        console.log('colName:[' + colName + ']');
        if (!order) return '';

        if (['title', 'id', 'author', 'price', 'totalPage', 'code', 'publishYear', 'size', 'quantity', 'updated_at','barcode'].includes(colName)) {
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


    let { categories, author, code, publishers, title, page = 1, pageSize = 10, order, sort } = ctx.request.body.data;


    order = sanityOrder(order);
    code = sanityString(code);
    author = sanityString(author);
    categories = sanityArrayNum(categories);
    publishers = sanityArrayNum(publishers);


    let _page = isNaN(page) ? 1 : parseInt(page);
    let _pgSize = isNaN(pageSize) ? 10 : parseInt(pageSize);
    const off_set = (_page - 1) * _pgSize;

    const titleFilter = title ? `
        b.title LIKE ${sanityString(title)}
    ` : ''
    const codeFilter = code ? `b.code LIKE ${code}` : '';
    const authorFilter = author ? `b.author LIKE ${author}` : ''

    const categoryFilter = categories && categories.length ? `c.id IN (${categories.join(',')})` : '';
    const joinCategory = `LEFT JOIN categories c ON b.category = c.id`

    const publisherFilter = publishers && publishers.length ? `p.id IN (${publishers.join(',')})` : '';
    const joinPublisher = `LEFT JOIN publishers p on b.publisher = p.id`;

    const finalFilter = [titleFilter, codeFilter, authorFilter, categoryFilter, publisherFilter]
        .filter(e => e)
        .join(' AND ');
    console.log('final filter:');
    console.log(finalFilter);

    const failSafe = finalFilter ? '' : '1';

    const query1 = `
        SELECT  b.id, b.title, b.publishPlace, b.code, b.publisher as publisherID, p.name as publisher, b.publishYear, b.category as categoryID, 
                c.name as category, b.author, b.size, b.price, b.totalPage, b.updated_at, COUNT(t.book) as quantity  
        FROM books b 
        ${joinCategory}
        ${joinPublisher}
        LEFT JOIN instances t
            ON b.id = t.book
        
        WHERE ${finalFilter} ${failSafe}
        GROUP BY b.id
        HAVING quantity >= 0
        ${generateOrderByQuery(sort, order)}
        LIMIT ${off_set}, ${_pgSize}
    `
    console.log(query1);
    const res = await strapi.connections.default.raw(query1)


    const query2 = `
        SELECT count(*) as total_items from books b 
        ${joinCategory}
            ${joinPublisher}
        WHERE ${finalFilter} ${failSafe}
    `;

    const count = await strapi.connections.default.raw(query2)

    ctx.send({
        count: parseInt(count[0][0].total_items),
        data: res[0]
    });


}

module.exports = findBooks;