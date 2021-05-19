const SqlString = require('sqlstring');
const { sanityArrayNum, sanityOrder, sanityString, sanityNumber } = require('../../helpers')

const exportPublishers = async (ctx, others) => {



    const query1 = `
            
        SELECT  x.name, x.address, x.total_books, y.total_instances FROM
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
        WHERE 1
    `;
    console.log(query1);

    const res = await strapi.connections.default.raw(query1)


    ctx.send({
        data: res[0]
    });


}

module.exports = exportPublishers;