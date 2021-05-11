
const getInstanceCurrentBorrowInfo = (instanceID) => {

    // const query = `
    //     SELECT bb.instance as instanceID, bb.borrow as borrowID, b.author, c.name as category, p.name as publisher, b.title as bookTitle, b.id as bookID, t.index, r.name as reader,
    //         r.id as readerID, MAX(br.date) as lastBorrowDate,
    //         COUNT(*) as borrowCount, 
    //         case when MAX(bb.returnDate IS NULL) = 0 THEN MAX(bb.returnDate) END AS lastReturnDate
    
    //     FROM borrow_books bb
    //     INNER JOIN borrows br
    //         ON bb.borrow = br.id
    //     INNER JOIN instances t 
    //         ON bb.instance = t.id
    //     INNER JOIN books b
    //         ON b.id = t.book
    //     LEFT JOIN publishers p 
    //         ON p.id = b.publisher
    //     LEFT JOIN categories c 
    //         ON c.id = b.category
    //     INNER JOIN readers r 
    //         ON r.id = br.reader
    //     WHERE bb.instance = ${instanceID}
    
    //     GROUP BY bb.instance
    // `

    const query2 = `
        SELECT t.id as instanceID,  t.index, x.lastBorrowDate, x.lastReturnDate, x.borrowCount, r.name as lastReader, r.id as lastReaderID, 
            (
                CASE WHEN x.lastReturnDate IS NOT NULL OR x.borrowCount = 0 THEN null
                ELSE r.id
                END
            ) as readerID,
            (
                CASE WHEN x.lastReturnDate IS NOT NULL OR x.borrowCount = 0 THEN null
                ELSE r.name
                END
            ) as reader,
                b.id as bookID, b.title as bookTitle, b.code, b.publishYear, b.author, b.price, b.size, b.totalPage, 
                p.name as publisher, c.name as category, c.id as categoryID, p.id as publisherID,
            
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
        LEFT JOIN borrows br
            ON x.lastBorrowDate = br.date
        LEFT JOIN readers r 
            ON r.id = br.reader
        INNER JOIN books b 
            ON b.id = t.book
        LEFT JOIN categories c 
            ON b.category = c.id
        LEFT JOIN publishers p 
            ON p.id = b.publisher
        WHERE t.id = ${instanceID}
    `
    return query2;
}

module.exports = getInstanceCurrentBorrowInfo