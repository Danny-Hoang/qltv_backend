
const SqlString = require('sqlstring');

const deleteBooks = async (ctx) => {


    let { bookIDs } = ctx.request.body;
    if (Array.isArray(bookIDs) && bookIDs.length) {
        bookIDs = bookIDs
            .filter(id => id && !isNaN(id))
        bookIDs = [...new Set(bookIDs)]

        if (bookIDs.length) {
            const query = `
                SELECT COUNT(*) as total_items FROM borrow_books bb
                INNER JOIN instances t 
                    ON bb.instance = t.id
                INNER JOIN books b 
                    ON b.id = t.book
                WHERE b.id IN (${bookIDs})
            `
            const res = await strapi.connections.default.raw(query);
            console.log('res[0]', res[0])
            if (res[0] && res[0][0] && res[0][0].total_items === '0') {
                const res1 = await strapi.connections.default.raw(`DELETE FROM instances WHERE book IN (${bookIDs})`);
                const res2 = await strapi.connections.default.raw(`DELETE FROM books WHERE id IN (${bookIDs})`);
                ctx.send({
                    data: res2[1]
                });
            }
        }
        // const query = `DELETE FROM readers WHERE id IN (${bookIDs.join(',')})`
        // const res = await strapi.connections.default.raw(query)

    }

}

module.exports = deleteBooks;