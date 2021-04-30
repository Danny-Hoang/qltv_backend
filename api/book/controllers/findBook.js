const { sanityArrayNum, sanityOrder, sanityString } = require('../../helpers');
const getBorrowingBooksByReaderID = require('./queries/getBorrowingBooksByReaderID');
const getReaderByBorrowingBook = require('./queries/getReaderByBorrowingBook');

const findBook = async (ctx, others) => {

    let { bookID, index, cardID, searchTerm } = ctx.request.body.data;

    bookID = isNaN(bookID) ? 0 : Number(bookID);
    index = isNaN(index) ? 0 : Number(index);
    cardID = isNaN(cardID) ? 0 : Number(cardID);
    searchTerm = sanityString(searchTerm);


    if (bookID && index) {

        const query = getReaderByBorrowingBook(bookID, index);
        console.log(query)
        const res = await strapi.connections.default.raw(query)
        const data = res[0];
        if (data && data.length) {
            const readerID = data[0].id;
            console.log(data[0])
            const res2 = await strapi.connections.default.raw(getBorrowingBooksByReaderID(readerID))
            ctx.send({
                data: res2[0],
                reader: res[0][0]
            });
        } else {
            ctx.send({
                data: [],
                reader: null
            });
        }




    } 
    // else if (cardID) {
    //     const res = await strapi.connections.default.raw(`
    //         SELECT r.id, r.name, r.birth, r.course, l.name as lop, r.type, r.address, r.phone, r.startDate, r.endDate 
    //         FROM readers r
    //         LEFT JOIN lops l
    //             ON r.lop = l.id
    //         WHERE r.id=${cardID}
    //     `)
        
    //     console.log(res[0]);
    //     if(res[0] && res[0].id) {
    //         const res2 = await strapi.connections.default.raw(getBorrowingBooksByReaderID(cardID));
    //         ctx.send({
    //             data: res2[0] || [],
    //             reader: res[0][0]
    //         });

    //     } else {
    //         ctx.send({
    //             data: [],
    //             reader: null
    //         });
    //     }
    // } 
    // else if (searchTerm) {
    //     const res = await strapi.connections.default.raw(`
    //         SELECT r.id, r.name, r.birth, r.course, l.name as lop, r.type, r.address, r.phone, r.startDate, r.endDate 
    //         FROM readers r
    //         LEFT JOIN lops l
    //             ON r.lop = l.id
    //         WHERE r.name LIKE ${searchTerm} LIMIT 0, 5
    //     `)

    //     ctx.send({
    //         data: null,
    //         reader: null,
    //         readers: res[0]
    //     });
    // }
    else {
        ctx.send({
            data: null,
            reader: null
        });
    }
}


module.exports = findBook;