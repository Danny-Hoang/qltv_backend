
const getInstanceCurrentBorrowInfo = (instanceID) => {

    const query = `
        SELECT bb.instance as instanceID, bb.borrow as borrowID, b.author, c.name as category, p.name as publisher, b.title as bookTitle, b.id as bookID, t.index, r.name as reader,
            r.id as readerID, MAX(br.date) as lastBorrowDate,
            COUNT(*) as borrowCount, 
            case when MAX(bb.returnDate IS NULL) = 0 THEN MAX(bb.returnDate) END AS lastReturnDate
    
        FROM borrow_books bb
        INNER JOIN borrows br
            ON bb.borrow = br.id
        INNER JOIN instances t 
            ON bb.instance = t.id
        INNER JOIN books b
            ON b.id = t.book
        LEFT JOIN publishers p 
            ON p.id = b.publisher
        LEFT JOIN categories c 
            ON c.id = b.category
        INNER JOIN readers r 
            ON r.id = br.reader
        WHERE bb.instance = ${instanceID}
    
        GROUP BY bb.instance
    `

    const query2 = `
        SELECT t.id, b.id as bookID, b.title as bookTitle, b.code, 
            p.id as  publisherID, p.name as publisher, c.id as categoryID, c.name as category, b.publishYear, 
            b.author, b.price, b.size, b.totalPage, t.index, brb.lastBorrowDate, brb.lastReturnDate, brb.borrowCount,
            (
                CASE WHEN (brb.borrowCount = 0 OR ISNULL(brb.lastBorrowDate) OR (brb.lastReturnDate IS NOT NULL AND brb.lastReturnDate > brb.lastBorrowDate))
                    THEN -1
                    ELSE DATEDIFF(DATE(CONVERT_TZ(CURDATE(), '+00:00','+07:00')), DATE(CONVERT_TZ(brb.lastBorrowDate, '+00:00','+07:00')))
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
            WHERE bb.instance=${instanceID}
            GROUP BY instance
        ) brb
        ON t.id = brb.instanceID
        WHERE t.id = ${instanceID}
    `
    return query2;
}

module.exports = getInstanceCurrentBorrowInfo