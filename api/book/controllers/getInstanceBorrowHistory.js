const SqlString = require('sqlstring');
const { sanityArrayNum, sanityOrder, sanityString, dmyToYmD } = require('../../helpers');
const getInstanceCurrentBorrowInfo = require('./queries/getInstanceCurrentBorrowInfo');


const getInstanceBorrowHistory = async (ctx) => {

    const generateOrderByQuery = (colName, order) => {
        order = sanityOrder(order);
        console.log('colName:[' + colName + ']');
        if (!order) return '';

        if (['bookID', 'bookTitle', 'category', 'phone', 'author', 'reader',
            'lop', 'type', 'borrowDate', 'borrowID', 'returnDate', 'lastBorrowDate', 'lastReturnDate', 'lastReaderID'
        ].includes(colName)) {
            return ` ORDER BY ${SqlString.escapeId(colName)} ${order} `
        }

        return '';
    }


    let { instanceID, page = 1, pageSize = 15, order, sort } = ctx.request.body.data;

    let _page = isNaN(page) ? 1 : parseInt(page);
    let _pgSize = isNaN(pageSize) ? 10 : parseInt(pageSize);
    const off_set = (_page - 1) * _pgSize;

    order = sanityOrder(order);

    const query1 = `
        SELECT b.id as bookID, b.title as bookTitle, b.author, c.name as category, p.name as publisher, t.index, r.name as reader, r.id as readerID,
            r.phone, l.name as lop, r.active, r.type, br.id as borrowID, br.date as borrowDate, brb.returnDate

        FROM borrow_books brb

        INNER JOIN instances t 
            ON brb.instance = t.id
        INNER JOIN books b 
            ON t.book = b.id 
        LEFT JOIN categories c 
            ON b.category = c.id
        LEFT JOIN publishers p
            ON b.publisher = p.id

        INNER JOIN borrows br
            ON brb.borrow = br.id
        LEFT JOIN readers r 
            ON r.id = br.reader
        LEFT JOIN lops l 
            ON r.lop = l.id
            
        WHERE t.id = ${instanceID}
        ORDER BY brb.returnDate ASC
        LIMIT ${off_set}, ${_pgSize}
    `;

    console.log(query1);


    const res = await strapi.connections.default.raw(query1);

    const query2 = getInstanceCurrentBorrowInfo(instanceID);
    const res2 = await strapi.connections.default.raw(query2);



    const query3 = `
        SELECT COUNT(*) as total_items

        FROM borrow_books brb
        INNER JOIN instances t 
            ON brb.instance = t.id
        WHERE t.id = ${instanceID}
    `


    const count = await strapi.connections.default.raw(query3)


    ctx.send({
        count: parseInt(count[0][0].total_items),
        borrowHistory: res[0],
        instanceInfo: res2[0][0]

    });
}

module.exports = getInstanceBorrowHistory;