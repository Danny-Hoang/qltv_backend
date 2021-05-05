const SqlString = require('sqlstring');
const { sanityArrayNum, sanityOrder, sanityString, sanityNumber } = require('../../helpers')

const findCategories = async (ctx, others) => {

    const generateOrderByQuery = (colName, order) => {
        order = sanityOrder(order);
        console.log('colName:[' + colName + ']');
        if (!order) return '';


        if (['id', 'name', 'code', 'total_books','updated_at'].includes(colName)) {
            return ` ORDER BY x.${colName} ${order} `
        }
        if (['total_instances'].includes(colName)) {
            return ` ORDER BY y.${colName} ${order} `
        }

        return '';
    }


    let { name, code, categoryID, page = 1, pageSize = 15, order, sort } = ctx.request.body;

    order = sanityOrder(order);
    name = sanityString(name);
    code = sanityString(code);
    categoryID = sanityNumber(categoryID);

    let _page = isNaN(page) ? 1 : parseInt(page);
    let _pgSize = isNaN(pageSize) ? 10 : parseInt(pageSize);
    const off_set = (_page - 1) * _pgSize;

    const nameFilter = name ? `x.name LIKE ${name}` : '';
    const codeFilter = name ? `x.code LIKE ${code}` : '';
    const idFilter = categoryID ? `x.id = ${categoryID}` : '';

    const finalFilter = [nameFilter, idFilter, codeFilter].filter(e => e).join(' AND ') || '1';

    const query1 = `
            
        SELECT x.id, x.name, x.code, x.total_books, x.updated_at, y.total_instances FROM
        (
            SELECT c.id, c.name, c.code, COUNT(b.id) as total_books, c.updated_at FROM categories c
            LEFT JOIN books b
                ON b.category = c.id
            GROUP BY c.id) x

        INNER JOIN (
            SELECT c.id, COUNT(b.id) as total_instances FROM categories c


            LEFT JOIN books b
                ON b.publisher = c.id
            LEFT JOIN instances t 
                ON b.id = t.book
            GROUP BY c.id
        ) y
            ON x.id = y.id
            WHERE ${finalFilter}
        ${generateOrderByQuery(sort, order)}
        LIMIT ${off_set}, ${_pgSize}
    `;
    console.log(query1);

    const res = await strapi.connections.default.raw(query1)
    if (categoryID) {
        ctx.send({
            data: res[0][0]
        });
    } else {

        const query2 = `
            select count(*) as total_items from categories 
            WHERE ${name ? `name LIKE ${name}` : '1'}
        `;

        const count = await strapi.connections.default.raw(query2)

        ctx.send({
            count: parseInt(count[0][0].total_items),
            data: res[0]
        });
    }


}

module.exports = findCategories;