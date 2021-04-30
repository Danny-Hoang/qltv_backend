const getBorrowingBookByIDAndIndex = (bookID, index) => {
    return `
    SELECT t.id, b.id as bookID, b.title, b.code, 
        p.id as  publisherID, p.name as publisher, c.id as categoryID, c.name as category, b.publishYear, 
        b.author, b.price, b.size, b.totalPage, t.index, brb.borrowDate, brb.returnDate, brb.borrowCount

    FROM instances t 
    INNER JOIN books b
        ON b.id = t.book
    LEFT JOIN categories c 
        ON b.category = c.id
    LEFT JOIN publishers p 
        ON b.publisher = p.id

    LEFT JOIN (
        SELECT bb.instance as instanceID, bb.borrow as borrowID, 
            COUNT(*) as borrowCount, MAX(b.date) as borrowDate, case when MAX(returnDate IS NULL) = 0 THEN max(returnDate) END AS returnDate
        FROM borrow_books bb
        INNER JOIN borrows b
            ON bb.borrow = b.id
        GROUP BY instance
    ) brb
    ON t.id = brb.instanceID
            
    WHERE b.id = ${bookID} AND t.index = ${index} AND brb.borrowCount > 0 AND ISNULL(brb.returnDate)
    `
}

module.exports = getBorrowingBookByIDAndIndex;