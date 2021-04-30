const { sanityArrayNum, sanityOrder, sanityString } = require('../../helpers')

const findBookOrReaderByName = async (ctx, others) => {

    let { searchTerm } = ctx.request.body.data;
    const isNamePattern = /[a-zA-Z]+/.test(searchTerm);
    if (!searchTerm || !isNamePattern || searchTerm.length < 3) {
        return;
    }

    searchTerm = sanityString(searchTerm);

    const readerRes = await strapi.connections.default.raw(`
            SELECT r.id, r.name, r.birth, r.course, l.name as lop, r.type, r.address, r.phone, r.startDate, r.endDate 
            FROM readers r
            LEFT JOIN lops l
                ON r.lop = l.id
            WHERE r.name LIKE ${searchTerm} LIMIT 0, 5
        `)

    const query = `
            SELECT id, title FROM books
            WHERE title LIKE ${searchTerm} LIMIT 0,5
        `

    const bookRes = await strapi.connections.default.raw(query)
    ctx.send({
        books: bookRes[0],
        readers: readerRes[0]
    });

}


module.exports = findBookOrReaderByName;