

const getTicketDetails = async (ctx, others) => {

    let { ticketID } = ctx.request.body;

    ticketID = isNaN(ticketID) ? 0 : Number(ticketID);

    if (ticketID) {
        const query = `
            SELECT t.id as instanceID, t.index, b.id as bookID, b.title as bookTitle, 
                bb.id as borrowBookID, br.id as borrowID, DATE_ADD(br.date, INTERVAL bb.maxDays DAY) as expireDate,
                r.name as reader, r.id as readerID, r.phone, l.name as lop, bb.returnDate, br.date as borrowDate FROM instances t 
            INNER JOIN books b 
                ON b.id = t.book
            INNER JOIN borrow_books bb	
                ON bb.instance = t.id 
            INNER JOIN borrows br 
                ON br.id = bb.borrow
            INNER JOIN readers r 
                ON r.id = br.reader
            LEFT JOIN lops l 
                ON l.id = r.lop
            WHERE br.id = ${ticketID}
        `
        const res = await strapi.connections.default.raw(query);

        ctx.send({
            data: res[0]
        });
    }

}
module.exports = getTicketDetails;