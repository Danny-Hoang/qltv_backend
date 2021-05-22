
const { sanityArrayNum, sanityOrder, sanityString } = require('../../helpers');
const getAvailableBookByBookIDAndIndex = require('./queries/getAvailableBookByBookIDAndIndex');
const getBorrowingBooksByReaderID = require('./queries/getBorrowingBooksByReaderID');

const findReaderAndBorrowingBooks = async (ctx, others) => {

    let { cardID } = ctx.request.body.data;

    cardID = isNaN(cardID) ? 0 : Number(cardID);



    if (cardID) {
        const res = await strapi.connections.default.raw(`
            SELECT r.id, r.name, r.birth, r.course, l.id as lopID, l.name as lop, r.type, r.address, r.phone, r.startDate, r.endDate , f.url as avatar
            FROM readers r
            LEFT JOIN lops l
                ON r.lop = l.id
            LEFT JOIN upload_file_morph u 
	            ON u.related_id = r.id AND u.related_type='readers' AND u.field='avatar'
            LEFT JOIN upload_file f 
	            ON u.upload_file_id = f.id
            WHERE r.id=${cardID}
        `)
        console.log(res[0])
        if (res[0] && res[0][0] && res[0][0].id) {

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
    else {
        ctx.send({
            data: null,
            reader: null
        });
    }
}


module.exports = findReaderAndBorrowingBooks;