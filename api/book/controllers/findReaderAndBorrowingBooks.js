
const { sanityArrayNum, sanityOrder, sanityString } = require('../../helpers');
const getAvailableBookByBookIDAndIndex = require('./queries/getAvailableBookByBookIDAndIndex');
const getBorrowingBooksByReaderID = require('./queries/getBorrowingBooksByReaderID');

const findReaderAndBorrowingBooks = async (ctx, others) => {

    let { cardID } = ctx.request.body.data;

    cardID = isNaN(cardID) ? 0 : Number(cardID);



    if (cardID) {
        const res = await strapi.connections.default.raw(`
            SELECT 
                r.id, r.name, r.birth, r.course, r.type, r.active, r.phone, r.startDate, r.endDate, r.updated_at, r.address, 
                l.name as lop, l.id as lopID, 
                y.avatar, y.fileID,
                IF(ISNULL(x.borrowCount), 0, x.borrowCount) as borrowCount, 
                IF(ISNULL(x.borrowingCount), 0, x.borrowingCount) as borrowingCount
            FROM readers r
            LEFT JOIN lops l
                ON r.lop = l.id
            LEFT JOIN (
                SELECT upload_file_id as fileID, related_id as readerID, u.url as avatar
                FROM upload_file_morph m
                LEFT JOIN upload_file u
                    ON m.upload_file_id = u.id
                WHERE related_type = 'readers' and field = 'avatar' AND m.related_id=${cardID}
            ) y
                ON r.id = y.readerID
        
            LEFT JOIN (
                SELECT r.id as readerID, 
                        SUM(IF(ISNULL(bb.id), 0, 1)) as borrowCount, 
                        SUM(IF(ISNULL(bb.returnDate) AND bb.id IS NOT NULL, 1, 0)) as borrowingCount
                FROM borrow_books bb
                LEFT JOIN borrows br
                        ON bb.borrow = br.id
                LEFT JOIN readers r
                    ON r.id = br.reader
                WHERE r.id = ${cardID}
                GROUP BY br.reader 
            ) x
                ON r.id = x.readerID
            WHERE r.id = ${cardID}
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