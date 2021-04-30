const getReaderByBorrowingBook = (bookID, index) => `
            SELECT brb.name, brb.id, brb.phone, brb.type, brb.lop,brb.course, brb.startDate, brb.endDate
            FROM instances t
        
        
            INNER JOIN (
                SELECT instance as instanceID, r.id, r.name, r.course, r.type, r.phone, r.startDate, r.endDate, r.birth, l.name as lop,
                COUNT(*) as borrowCount, case when MAX(returnDate IS NULL) = 0 THEN max(returnDate) END AS returnDate
                FROM borrow_books bb
                INNER JOIN borrows br
                    ON bb.borrow = br.id
                LEFT JOIN readers r
                    ON br.reader = r.id
                LEFT JOIN lops l 
                    ON r.lop = l.id
                WHERE ISNULL(bb.returnDate)
                GROUP BY instance
            ) brb

            ON brb.instanceID = t.id
            
            WHERE t.book = ${bookID} AND t.index = ${index}
        `


module.exports = getReaderByBorrowingBook;