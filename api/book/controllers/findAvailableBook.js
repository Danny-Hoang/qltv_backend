
const { sanityArrayNum, sanityOrder, sanityString } = require('../../helpers');
const getAvailableBookByBookIDAndIndex = require('./queries/getAvailableBookByBookIDAndIndex');
const getBorrowingBooksByReaderID = require('./queries/getBorrowingBooksByReaderID');

const findAvailableBook = async (ctx, others) => {

    let { bookID, index, cardID } = ctx.request.body.data;

    bookID = isNaN(bookID) ? 0 : Number(bookID);
    index = isNaN(index) ? 0 : Number(index);
    cardID = isNaN(cardID) ? 0 : Number(cardID);



    if (bookID && index) {

        //tìm sách khả dụng theo bookID và index
        const query = getAvailableBookByBookIDAndIndex(bookID, index);

        console.log(query)
        const res = await strapi.connections.default.raw(query)
        if(res[0] && res[0][0] && res[0][0].bookID) {
            ctx.send({
                book: res[0][0]
            });
        } else {
            ctx.send({
                book: null
            });
        }




    } else if (cardID) {
        const res = await strapi.connections.default.raw(`
            SELECT r.id, r.name, r.birth, r.course, l.name as lop, r.type, r.address, r.phone, r.startDate, r.endDate 
            FROM readers r
            LEFT JOIN lops l
                ON r.lop = l.id
            WHERE r.id=${cardID}
        `)
        if(res[0] && res[0].id) {
        
            //lấy danh sách sách đang mượn bởi cardID
            const res2 = await strapi.connections.default.raw(getBorrowingBooksByReaderID(cardID));
    
            //trả về thông tin reader và list sách reader đó đang mượn
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


module.exports = findAvailableBook;