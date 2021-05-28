const query = `
    SELECT t.id, b.id as bookID, b.title as bookTitle, b.code, 
        p.id as  publisherID, p.name as publisher, c.id as categoryID, c.name as category, b.publishYear, 
        b.author, b.price, b.size, b.totalPage, t.index, brb.lastBorrowDate, brb.lastReturnDate, brb.borrowCount,
        (
            CASE WHEN (brb.borrowCount = 0 OR ISNULL(brb.lastBorrowDate) OR (brb.lastReturnDate IS NOT NULL AND brb.lastReturnDate > brb.lastBorrowDate))
                THEN -1
                ELSE DATEDIFF(DATE(CONVERT_TZ(Now(), '+00:00','+07:00')), DATE(CONVERT_TZ(brb.lastBorrowDate, '+00:00','+07:00')))
            END
        ) as days_on_loan

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
        GROUP BY bb.instance
    ) brb
    ON t.id = brb.instanceID
`

const queryCount = `
SELECT COUNT(*) as total_items

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
`