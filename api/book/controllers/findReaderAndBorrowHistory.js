
const { sanityArrayNum, sanityOrder, sanityString } = require('../../helpers');

const findReaderAndBorrowHistory = async (ctx, others) => {

    let { readerID, page = 1, pageSize = 15, order, sort } = ctx.request.body.data;

    readerID = isNaN(readerID) ? 0 : Number(readerID);



    if (readerID) {
        const res = await strapi.connections.default.raw(`
            SELECT r.id, r.name, r.birth, r.course, l.name as lop, r.type, r.address, r.phone, r.startDate, r.endDate 
            FROM readers r
            LEFT JOIN lops l
                ON r.lop = l.id
            WHERE r.id=${readerID}
        `)
        if (res[0] && res[0][0] && res[0][0].id) {

            //lấy danh sách sách  mượn bởi cardID

            const query = `
                SELECT b.id as bookID, t.id as instanceID, b.title as bookTitle, b.author, c.name as category, p.name as publisher, t.index, 
                    br.id as borrowID, br.date as borrowDate, brb.returnDate
            
                FROM borrow_books brb
            
                INNER JOIN instances t 
                    ON brb.instance = t.id
                INNER JOIN books b 
                    ON t.book = b.id 
                LEFT JOIN categories c 
                    ON b.category = c.id
                LEFT JOIN publishers p
                    ON b.publisher = p.id
            
                INNER JOIN borrows br
                    ON brb.borrow = br.id
                INNER JOIN readers r 
                    ON r.id = br.reader

                WHERE r.id = ${readerID}
                ORDER BY brb.returnDate ASC
            `;
            const res2 = await strapi.connections.default.raw(query);

            const res3 = await strapi.connections.default.raw(`
                SELECT COUNT(*) as total_items
            
                FROM borrow_books brb
                INNER JOIN borrows br
                    ON brb.borrow = br.id
                INNER JOIN readers r 
                    ON r.id = br.reader

                WHERE r.id = ${readerID}
            `)

            //trả về thông tin reader và list sách reader đó đang mượn
            ctx.send({
                data: res2[0],
                reader: res[0][0],
                count: res3[0][0].total_items
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


module.exports = findReaderAndBorrowHistory;