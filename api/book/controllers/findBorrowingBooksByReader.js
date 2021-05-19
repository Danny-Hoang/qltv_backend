
const { sanityArrayNum, sanityOrder, sanityString } = require('../../helpers');
const getAvailableBookByBookIDAndIndex = require('./queries/getAvailableBookByBookIDAndIndex');
const getBorrowingBooksByReaderID = require('./queries/getBorrowingBooksByReaderID');

const findBorrowingBooksByReader = async (ctx, others) => {

    let { cardID } = ctx.request.body.data;

    cardID = isNaN(cardID) ? 0 : Number(cardID);

    if (cardID) {


        //lấy danh sách sách đang mượn bởi cardID
        const res = await strapi.connections.default.raw(getBorrowingBooksByReaderID(cardID));

        ctx.send({
            data: res[0],
        });

    }
}


module.exports = findBorrowingBooksByReader;