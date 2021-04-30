const getAvailableBookByBookIDAndIndex = (bookID, index) => `
    SELECT t.id as instanceID, b.id as bookID, b.title as bookTitle, b.code, 
            p.id as  publisherID, p.name as publisher, c.id as categoryID, c.name as category, b.publishYear, 
            b.author, b.price, b.size, b.totalPage, t.index, brb.lastBorrowDate, brb.lastReturnDate, brb.borrowCount

    FROM instances t 
    INNER JOIN books b
        ON b.id = t.book
    LEFT JOIN categories c 
        ON b.category = c.id
    LEFT JOIN publishers p 
        ON b.publisher = p.id

    LEFT JOIN (
        SELECT bb.instance as instanceID, bb.borrow as borrowID, 
        COUNT(*) as borrowCount, MAX(b.date) as lastBorrowDate, case when MAX(returnDate IS NULL) = 0 THEN max(returnDate) END AS lastReturnDate
        FROM borrow_books bb
        INNER JOIN borrows b
            ON bb.borrow = b.id
        GROUP BY instance
    ) brb
    ON t.id = brb.instanceID
                
    WHERE b.id = ${bookID} AND t.index = ${index} AND (
        brb.borrowCount = 0 OR ISNULL(brb.borrowCount) OR ISNULL(brb.lastBorrowDate) OR brb.lastBorrowDate < brb.lastReturnDate
    )
`

module.exports = getAvailableBookByBookIDAndIndex;