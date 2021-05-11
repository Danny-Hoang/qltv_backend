
const { sanityArrayNum, sanityOrder, sanityString } = require('../../helpers');

const findReaderAndBorrowHistory = async (ctx, others) => {

    let { readerID, page = 1, pageSize = 10, order, sort } = ctx.request.body.data;

    let _page = isNaN(page) ? 1 : parseInt(page);
    let _pgSize = isNaN(pageSize) ? 10 : parseInt(pageSize);
    const off_set = (_page - 1) * _pgSize;

    const pagination = _pgSize > 0 ? `LIMIT ${off_set}, ${_pgSize}` : '';
    readerID = isNaN(readerID) ? 0 : Number(readerID);

    if (readerID) {

        //lấy danh sách sách  mượn bởi readerID
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
                ${pagination}
            `;
        const res = await strapi.connections.default.raw(query);

        const res2 = await strapi.connections.default.raw(`
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
            data: res[0],
            count: res2[0][0].total_items
        });

    } else {
        ctx.send({
            data: null,
            reader: null
        });
    }
}


module.exports = findReaderAndBorrowHistory;