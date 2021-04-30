const SqlString = require('sqlstring');
const  { sanityArrayNum, sanityOrder, sanityString } = require('../../helpers')

const findCategories = async (ctx, others) => {

    const generateOrderByQuery = (colName, order) => {
        order = sanityOrder(order);
        console.log('colName:[' + colName + ']');
        if (!order) return '';

        if (['id', 'name', 'totalBooks'].includes(colName)) {
            return ` ORDER BY ${SqlString.escapeId(colName)} ${order} `
        }

        return '';
    }


    let { name, page = 1, pageSize = 10, order, sort } = ctx.request.body.data;


    order = sanityOrder(order);
    name = sanityString(name);

    let _page = isNaN(page) ? 1 : parseInt(page);
    let _pgSize = isNaN(pageSize) ? 10 : parseInt(pageSize);
    const off_set = (_page - 1) * _pgSize;

    const nameFilter = name ? `b.name LIKE ${name}` : '';

    const failSafe = nameFilter ? '' : '1';

    const query1 = `
                    SELECT c.id, c.name, COUNT(*) as totalBooks FROM categories c
                    LEFT JOIN books b
                    ON b.category = c.id
                    GROUP BY b.category
                    ${generateOrderByQuery(sort, order)}
                    LIMIT ${off_set}, ${_pgSize}
    `
    console.log(query1);
    const res = await strapi.connections.default.raw(query1)

    const query2 = `
                    SELECT count(*) as total_items from categories 
                    WHERE ${nameFilter} ${failSafe}
    `;

    const count = await strapi.connections.default.raw(query2)

    ctx.send({
        count: parseInt(count[0][0].total_items),
        data: res[0]
    });


}

module.exports = findCategories;