const SqlString = require('sqlstring');
const { sanityArrayNum, sanityOrder, sanityString, dmyToYmD } = require('../../helpers')

const findTickets = async (ctx, others) => {

    const generateOrderByQuery = (colName, order) => {
        order = sanityOrder(order);
        console.log('colName:[' + colName + ']');
        if (!order) return '';

        if (['borrowDate', 'borrowID', 'quantity', 'ticketID', 'reader', 'course', 'lop', 'readerID'].includes(colName)) {
            return ` ORDER BY ${SqlString.escapeId(colName)} ${order} `
        }

        // if (colName === 'readerID') {
        //     return ` ORDER BY r.id ${order}`
        // }

        // if (colName === 'reader') {
        //     return ` ORDER BY r.name ${order}`
        // }

        return '';
    }


    let { reader, borrowDate, page = 1, pageSize = 15, order, sort } = ctx.request.body.data;


    const readerFilter = reader ? `r.name LIKE ${sanityString(reader)}` : ''
    let borrowFilter = ``
    console.log('borrowDate', borrowDate)

    if (/^\d{2}-\d{2}-\d{4}to\d{2}-\d{2}-\d{4}$/.test(borrowDate)) {
        const arr = borrowDate.split('to');
        console.log(arr);
        const startDate = dmyToYmD(arr[0], '-');
        const endDate = dmyToYmD(arr[1], '-');
        borrowFilter = `DATE(CONVERT_TZ(b.date, '+00:00','+07:00')) BETWEEN '${startDate}' AND '${endDate}'`;
    }


    let _page = isNaN(page) ? 1 : parseInt(page);
    let _pgSize = isNaN(pageSize) ? 10 : parseInt(pageSize);
    const off_set = (_page - 1) * _pgSize;

    const finalFilter = [readerFilter, borrowFilter]
        .filter(e => e)
        .join(' AND ');
    console.log('final filter:');
    console.log(finalFilter);

    const failSafe = finalFilter ? '' : '1';

    const query1 = `
        SELECT b.id as ticketID, r.name as reader, r.type, l.name as lop, r.id as readerID, r.course, r.phone, b.date as borrowDate, COUNT(brb.borrow) as quantity 
        FROM borrows b 
        INNER JOIN readers r
            ON b.reader = r.id 
        INNER JOIN borrow_books brb
            ON b.id = brb.borrow
        LEFT JOIN lops l
            ON r.lop = l.id

        WHERE ${finalFilter} ${failSafe}
        GROUP BY b.id
        HAVING quantity >= 0
        
        ${generateOrderByQuery(sort, order)}
        LIMIT ${off_set}, ${_pgSize}
    `
    console.log(query1);
    const res = await strapi.connections.default.raw(query1)


    const query2 = `
        SELECT COUNT(*) as total_items FROM (
            SELECT COUNT(brb.borrow) as quantity FROM borrows b
            INNER JOIN readers r
                ON b.reader = r.id 
            INNER JOIN borrow_books brb
                ON b.id = brb.borrow
            WHERE ${finalFilter} ${failSafe}
            GROUP BY b.id
            HAVING quantity >= 0
        
        ) t
    `;

    const count = await strapi.connections.default.raw(query2)

    let totalItem = 0;
    if(count[0][0] && count[0][0].total_items) {
        totalItem = count[0][0].total_items
    }
    ctx.send({
        count: parseInt(totalItem),
        data: res[0]
    });


}

module.exports = findTickets;