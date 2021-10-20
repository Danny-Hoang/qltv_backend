let getBorrowingBooksByReaderID = (rID) => `
    SELECT b.id as bookID, t.id as instanceID, t.index, b.title as bookTitle, b.code, b.author, 
        br.date as borrowDate, br.id as borrowID, bb.id as borrowBookID, bb.returnDate, c.name as category, p.name as publisher,
        r.id as readerID, DATE_ADD(br.date, INTERVAL bb.maxDays DAY) as expireDate
        
    FROM borrows br
    INNER JOIN borrow_books bb
        ON br.id =bb.borrow
    INNER JOIN instances t
        ON bb.instance = t.id 
    INNER JOIN books b 
        ON t.book = b.id
    LEFT JOIN categories c
        ON c.id = b.category
    LEFT JOIN publishers p
        ON p.id = b.publisher
    INNER JOIN readers r 
        ON r.id = br.reader

    WHERE r.id = ${rID} AND ISNULL(bb.returnDate)
    `;

module.exports = getBorrowingBooksByReaderID;