
const SqlString = require('sqlstring');
const { sanityArrayNum, sanityOrder, sanityString, escapeString, sanityNumber } = require('../../helpers')

const findInstances = async (ctx) => {

    const generateOrderByQuery = (colName, order) => {
        order = sanityOrder(order);
        console.log('colName:[' + colName + ']');
        if (!order) return '';

        if (['title', 'author', 'price', 'totalPage', 'code', 'publishYear', 'borrowCount','lastReturnDate', 
                'lastBorrowDate', 'days_on_loan',
                'size', 'category', 'publisher'].includes(colName)) {
            return ` ORDER BY ${SqlString.escapeId(colName)} ${order} `
        }

        if (colName === 'barcode') {
            return ` ORDER BY bookID ${order}`
        }

        return '';
    }


    let { categories, author, code, publishers, bookTitle, bookID, page = 1, pageSize = 15, order, sort } = ctx.request.body;


    order = sanityOrder(order);
    code = sanityString(code);
    author = sanityString(author);
    categories = sanityArrayNum(categories);
    publishers = sanityArrayNum(publishers);


    let _page = isNaN(page) ? 1 : parseInt(page);
    let _pgSize = isNaN(pageSize) ? 10 : parseInt(pageSize);
    const off_set = (_page - 1) * _pgSize;

    // const bookIDPattern = /^(\d+)\.(\d+)$/;
    // const isBookIDPattern = bookIDPattern.test(title);


    const instanceIDPattern = /^(\d+)\.(\d+)$/;
    const isInstanceIDPattern = instanceIDPattern.test(bookTitle);

    let titleFilter = '';
    if (isInstanceIDPattern) {
        const [, bookID, index] = bookTitle.match(instanceIDPattern);
        if (bookID && index) {
            titleFilter = `(b.id = ${bookID} AND t.index=${index})`;
        }
    } else if (bookTitle && !isNaN(bookTitle)) {
        titleFilter = `b.id = ${bookTitle}`;
    } else {
        titleFilter = bookTitle ? `b.title LIKE ${sanityString(bookTitle)}` : '';
    }

    const bookIDFilter = bookID ? `b.id = ${sanityNumber(bookID)}`: ''

    // const titleFilter = title ? `
    //     MATCH (b.title) AGAINST (${SqlString.escape(title)} IN NATURAL LANGUAGE MODE) 
    // ` : ''
    const codeFilter = code ? `b.code LIKE ${code}` : '';
    const authorFilter = author ? `b.author LIKE ${author}` : ''

    const categoryFilter = categories && categories.length ? `c.id IN (${categories.join(',')})` : '';


    const publisherFilter = publishers && publishers.length ? `p.id IN (${publishers.join(',')})` : '';


    const finalFilter = [titleFilter, codeFilter, authorFilter, categoryFilter, publisherFilter, bookIDFilter]
        .filter(e => e)
        .join(' AND ');

    const failSafe = finalFilter ? '' : '1';

    const query1 = `

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
        

            
        WHERE ${finalFilter} ${failSafe}

        ${generateOrderByQuery(sort, order)}
        LIMIT ${off_set}, ${_pgSize}
`
    console.log(query1);
    const res = await strapi.connections.default.raw(query1)


    const query2 = `
    SELECT COUNT(*) as total_items
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
        

            
        WHERE ${finalFilter} ${failSafe}
    `

    const count = await strapi.connections.default.raw(query2)

    ctx.send({
        count: parseInt(count[0][0].total_items),
        data: res[0]
    });
}

module.exports = findInstances;