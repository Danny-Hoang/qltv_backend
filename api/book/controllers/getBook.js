const { sanityArrayNum, sanityOrder, sanityString } = require('../../helpers')

const getBook = async (ctx, others) => {

    let { bookID } = ctx.request.body.data;

    bookID = isNaN(bookID) ? 0 : Number(bookID);


    if (bookID) {

        const query = `
        SELECT b.title, b.price, b.author, b.code, b.totalPage, b.category, b.publisher, b.publishPlace, b.publishYear, b.size, 
            b.updated_at, b.importDate, COUNT(t.book) as quantity FROM books b
        LEFT JOIN instances t
            ON b.id = t.book
            WHERE b.id = ${bookID}
        GROUP BY b.id
        HAVING quantity >= 0
            
        `
        console.log(query)
        const res = await strapi.connections.default.raw(query)
        ctx.send({
            data: res[0],
        });
    }
}


module.exports = getBook;