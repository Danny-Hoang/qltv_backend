const SqlString = require('sqlstring');
const { sanityArrayNum, sanityOrder, sanityString, sanityNumber } = require('../../helpers')

const exportCategories = async (ctx, others) => {


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
            WHERE 1
    `;
    console.log(query1);

    const res = await strapi.connections.default.raw(query1)


    ctx.send({
        data: res[0]
    });


}

module.exports = exportCategories;