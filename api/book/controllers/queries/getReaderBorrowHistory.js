let getReaderBorrowHistory = (rID) => `
    SELECT b.id as bookID, b.title as bookTitle, b.author, c.name as category, p.name as publisher, t.index, r.name as reader, 
        r.phone, l.name as lop, r.active, r.type, br.id as borrowID, br.date as borrowDate, brb.returnDate

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
    LEFT JOIN readers r 
        ON r.id = br.reader
    LEFT JOIN lops l 
        ON r.lop = l.id

    WHERE r.id = ${rID}
    ORDER BY brb.returnDate ASC
`;

module.exports = getReaderBorrowHistory;