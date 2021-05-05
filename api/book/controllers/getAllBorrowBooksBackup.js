const SqlString = require('sqlstring');
const { sanityArrayNum, sanityOrder, sanityString } = require('../../helpers')

const BookStatus = {
    DANGMUON: 'dangmuon',
    TOI_HAN: 'toihan',
    QUA_HAN: 'quahan'
}

const getAllBorrowBooks = async (ctx) => {

    const generateOrderByQuery = (colName, order) => {
        order = sanityOrder(order);
        console.log('colName:[' + colName + ']');
        if (!order) return '';

        if (['bookID', 'bookTitle', 'category', 'phone', 'author', 'reader', 'lop', 'type', 'borrowDate', 'returnDate'].includes(colName)) {
            return ` ORDER BY ${SqlString.escapeId(colName)} ${order} `
        }

        return '';
    }


    let { bookTitle, reader, author, publishers, categories, page = 1, pageSize = 15, status, order, sort } = ctx.request.body.data;


    order = sanityOrder(order);
    bookTitle = sanityString(bookTitle);
    reader = sanityString(reader);
    author = sanityString(author);
    categories = sanityArrayNum(categories);
    publishers = sanityArrayNum(publishers);

    const isFilterBorrowing = status === 'dangmuon';
    const isFilterDueDate = status === 'toihan';
    const isFilterOverdue = status === 'quahan';

    console.log(status)


    let _page = isNaN(page) ? 1 : parseInt(page);
    let _pgSize = isNaN(pageSize) ? 10 : parseInt(pageSize);
    const off_set = (_page - 1) * _pgSize;

    const bookTitleFilter = bookTitle ? `b.title LIKE ${bookTitle}` : '';
    const readerFilter = reader ? `r.name LIKE ${reader}` : '';
    const authorFilter = author ? `b.author LIKE ${author}` : ''

    const categoryFilter = categories && categories.length ? `b.categoryID IN (${categories.join(',')})` : '';


    const publisherFilter = publishers && publishers.length ? `b.publisherID IN (${publishers.join(',')})` : '';

    const borrowingFilter =  `ISNULL(brb.returnDate)`
    const dueDateFilter = `ISNULL(brb.returnDate) AND DATE(br.date) = DATE_ADD(CURDATE(),INTERVAL -7 DAY)`;
    const overDueFilter = `ISNULL(brb.returnDate) AND DATE(br.date) < DATE_ADD(CURDATE(),INTERVAL -7 DAY)`;

    const finalBorrowingFilter = isFilterBorrowing ? borrowingFilter : 
                                    isFilterDueDate ? dueDateFilter :
                                    isFilterOverdue ? overDueFilter : ''

    const finalFilter = [bookTitleFilter, readerFilter, authorFilter, categoryFilter, publisherFilter, finalBorrowingFilter]
        .filter(e => e)
        .join(' AND ');


    const failSafe = finalFilter ? '' : '1';

    const query1 = `
        SELECT b.id as bookID, b.title as bookTitle, b.author, c.name as category, p.name as publisher, t.index, r.name as reader, 
            r.phone, l.name as lop, r.active, r.type, br.date as borrowDate, brb.returnDate
    
        FROM borrow_books brb
        INNER JOIN instances t 
            ON brb.instance = t.id
        INNER JOIN books b 
            ON t.book = b.id 
        LEFT JOIN categories c 
            ON b.category = c.id
        LEFT JOIN publishers p
            ON b.publisher = p.id
        
        LEFT JOIN borrows br
            ON brb.borrow = br.id
        LEFT JOIN readers r 
            ON r.id = br.reader
        LEFT JOIN lops l 
            ON r.lop = l.id
            
            WHERE ${finalFilter} ${failSafe}

        ${generateOrderByQuery(sort, order)}
        LIMIT ${off_set}, ${_pgSize}
    `;

    const res = await strapi.connections.default.raw(query1);

    const borrowingCountFilter = [bookTitleFilter, readerFilter, authorFilter, categoryFilter, publisherFilter, borrowingFilter]
                            .filter(e => e)
                            .join(' AND ');
    const dueCountFilter = [bookTitleFilter, readerFilter, authorFilter, categoryFilter, publisherFilter, dueDateFilter]
                            .filter(e => e)
                            .join(' AND ');
    const overdueCountFilter = [bookTitleFilter, readerFilter, authorFilter, categoryFilter, publisherFilter, overDueFilter]
                            .filter(e => e)
                            .join(' AND ');

    const queryBody = `
        SELECT COUNT(*) as total_items
    
        FROM borrow_books brb
        INNER JOIN instances t 
            ON brb.instance = t.id
        INNER JOIN books b 
            ON t.book = b.id 
        LEFT JOIN categories c 
            ON b.category = c.id
        
        LEFT JOIN borrows br
            ON brb.borrow = br.id
        LEFT JOIN readers r 
            ON r.id = br.reader
        LEFT JOIN lops l 
            ON r.lop = l.id        
    `

    const query2 = `${queryBody} WHERE ${borrowingCountFilter || '1'}`;
    const query3 = `${queryBody} WHERE ${dueCountFilter || '1'}`;
    const query4 = `${queryBody} WHERE ${overdueCountFilter || '1'}`


    const borrowingCount = await strapi.connections.default.raw(query2);
    const dueCount = await strapi.connections.default.raw(query3);
    const overdueCount = await strapi.connections.default.raw(query4);



    ctx.send({
        borrowingCount: parseInt(borrowingCount[0][0].total_items),
        dueCount: parseInt(dueCount[0][0].total_items),
        overdueCount: parseInt(overdueCount[0][0].total_items),
        data: res[0]
    });
}

module.exports = getAllBorrowBooks;