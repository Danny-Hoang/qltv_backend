const  { sanityArrayNum, sanityOrder, sanityString } = require('../../helpers')

const getBorrowingBook = async (ctx) => {
    const query = `
        SELECT b.id as bookID, b.title as bookTitle, c.name as category, t.index, r.name as reader, 
        r.phone, l.name as lop, r.active, r.type, br.date as borrowDate  

        FROM instances t 
        INNER JOIN books b 
            ON t.book = b.id 
        LEFT JOIN categories c 
            ON b.category = c.id
        
        INNER JOIN (
            SELECT instance as instanceID, borrow, 
            case when MAX(returnDate IS NULL) = 0 THEN max(returnDate) END AS returnDate
            FROM borrow_books
            GROUP BY instance
        ) brb
            ON t.id = brb.instanceID
        INNER JOIN borrows br
            ON brb.borrow = br.id
        INNER JOIN readers r 
            ON r.id = br.reader
        LEFT JOIN lops l 
            ON r.lop = l.id
        WHERE ISNULL(brb.returnDate)
    `;
    const res = await strapi.connections.default.raw(query);
    ctx.send({
        data: res[0]
    });
}

module.exports = getBorrowingBook;