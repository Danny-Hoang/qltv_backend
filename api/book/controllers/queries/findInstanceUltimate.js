const query = `
    SELECT x.instanceID, x.lastBorrowDate, x.lastReturnDate, x.borrowCount, r.name as reader, r.id as readerID,
        b.id as bookID, b.title as bookTitle, b.publishYear, b.author, b.price, b.size, b.totalPage, 
        p.name as publisher, c.name as category, c.id as categoryID, p.id as publisherID,
        t.index,
    (
        CASE WHEN x.lastReturnDate IS NOT NULL OR x.borrowCount = 0
            THEN -1
            ELSE DATEDIFF(DATE(CONVERT_TZ(CURDATE(), '+00:00','+07:00')), DATE(CONVERT_TZ(x.lastBorrowDate, '+00:00','+07:00')))
        END
    ) as days_on_loan
    FROM instances t 
    LEFT JOIN 
    (SELECT bb.instance as instanceID,  
        COUNT(*) as borrowCount, MAX(br.date) as lastBorrowDate, case when MAX(returnDate IS NULL) = 0 THEN max(returnDate) END AS lastReturnDate
        FROM borrow_books bb
        INNER JOIN borrows br
            ON bb.borrow = br.id
        GROUP BY bb.instance
    )x
        ON t.id = x.instanceID
    INNER JOIN borrows br
        ON x.lastBorrowDate = br.date
    INNER JOIN readers r 
        ON r.id = br.reader
    INNER JOIN books b 
        ON b.id = t.book
    LEFT JOIN categories c 
        ON b.category = c.id
    LEFT JOIN publishers p 
        ON p.id = b.publisher
        

`

return query;