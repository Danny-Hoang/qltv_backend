const query1 = `
    SELECT  b.id, b.title, b.publishPlace, b.code, b.publisher as publisherID, x.borrowCount,
        p.name as publisher, b.publishYear, b.category as categoryID, 
            c.name as category, b.author, b.size, b.price, b.totalPage, b.updated_at, b.importDate, COUNT(t.book) as quantity  
    FROM books b 
    LEFT JOIN categories c 
        ON b.category = c.id
    LEFT JOIN publishers p 
        ON b.publisher = p.id
    LEFT JOIN instances t 
            ON t.book = b.id
    LEFT JOIN (
        SELECT b.id, COUNT(b.id) as borrowCount from borrow_books bb 
        INNER JOIN borrows br
            ON br.id = bb.borrow
        LEFT JOIN instances t 
            ON t.id = bb.instance
        LEFT JOIN books b 
            ON b.id = t.book
        GROUP BY b.id
    ) x
        ON x.id = b.id
        
        WHERE 1
        GROUP BY b.id`