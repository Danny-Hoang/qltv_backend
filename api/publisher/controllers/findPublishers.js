const SqlString = require('sqlstring');
const { sanityArrayNum, sanityOrder, sanityString, sanityNumber } = require('../../helpers')

const findPublishers = async(ctx, others) => {

    const generateOrderByQuery = (colName, order) => {
        order = sanityOrder(order);
        console.log('colName:[' + colName + ']');
        if (!order) return '';

        if (['id', 'name', 'total_books','total_instances','updated_at'].includes(colName)) {
            return ` ORDER BY ${SqlString.escapeId(colName)} ${order} `
        }

        return '';
    }


    let { name, publisherID, page = 1, pageSize = 15, order, sort } = ctx.request.body;

    order = sanityOrder(order);
    name = sanityString(name);
    publisherID = sanityNumber(publisherID);

    let _page = isNaN(page) ? 1 : parseInt(page);
    let _pgSize = isNaN(pageSize) ? 10 : parseInt(pageSize);
    const off_set = (_page - 1) * _pgSize;

    const nameFilter = name ? `x.name LIKE ${name}` : '';
    const idFilter = publisherID ? `x.id = ${publisherID}` : '';

    const finalFilter = [nameFilter, idFilter].filter(e => e).join(' AND ') || '1';

    const query1 = `
            
        SELECT x.id, x.name, x.address, x.total_books, x.updated_at, y.total_instances FROM
        (
            SELECT p.id, p.name, p.address, COUNT(b.id) as total_books, p.updated_at FROM publishers p
            LEFT JOIN books b
            ON b.publisher = p.id
            GROUP BY p.id) x

        INNER JOIN (
            SELECT p.id, COUNT(b.id) as total_instances FROM publishers p 


            LEFT JOIN books b
                ON b.publisher = p.id
            LEFT JOIN instances t 
            ON b.id = t.book
            GROUP BY p.id
        ) y
        ON x.id = y.id

        WHERE ${finalFilter}
        ${generateOrderByQuery(sort, order)}
        LIMIT ${off_set}, ${_pgSize}
    `;
    console.log(query1);

    const res = await strapi.connections.default.raw(query1)
    if(publisherID) {
        ctx.send({
            data: res[0][0]
        });
    } else {

        const query2 = `
            select count(*) as total_items from publishers 
            WHERE ${name ? `name LIKE ${name}` : '1'}
        `;

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


}

module.exports = findPublishers;