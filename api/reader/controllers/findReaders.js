const SqlString = require('sqlstring');
const { sanityArrayNum, sanityOrder, sanityString, sanityNumber } = require('../../helpers')

const findReaders = async (ctx) => {

    const generateOrderByQuery = (colName, order) => {
        order = sanityOrder(order);
        console.log('colName:[' + colName + ']');
        if (!order) return '';

        if (['name', 'id', 'address', 'birth', 'course', 'type', 'phone', 'active', 'startDate', 'endDate', 'updated_at', 'borrowCount','borrowingCount'].includes(colName)) {
            return ` ORDER BY ${SqlString.escapeId(colName)} ${order} `
        }

        if (colName === 'lop') {
            return ` ORDER BY l.name ${order}`
        }
        return '';
    }

    console.log('s:',ctx.request.body)
    let { name, readerID, page = 1, pageSize = 15, order, sort } = ctx.request.body;

    readerID = sanityNumber(readerID)
    order = sanityOrder(order);
    name = sanityString(name);

    let _page = isNaN(page) ? 1 : parseInt(page);
    let _pgSize = isNaN(pageSize) ? 10 : parseInt(pageSize);
    const off_set = (_page - 1) * _pgSize;

    const nameFilter = name ? `r.name LIKE ${name}` : '';
    const idFilter = readerID ? `r.id = ${readerID}` : '';



    const finalFilter = [nameFilter, idFilter].filter(e => e).join(' AND ') || '1';
    console.log('sort:',sort)
    const query1 = `
     SELECT 
        r.id, r.name, r.birth, r.course, r.type, r.active, r.phone, r.startDate, r.endDate, r.updated_at, r.address, 
        l.name as lop, l.id as lopID, 
        y.avatar, y.fileID,
        IF(ISNULL(x.borrowCount), 0, x.borrowCount) as borrowCount, 
        IF(ISNULL(x.borrowingCount), 0, x.borrowingCount) as borrowingCount
    FROM readers r
    LEFT JOIN lops l
        ON r.lop = l.id
    LEFT JOIN (
        SELECT upload_file_id as fileID, related_id as readerID, u.url as avatar
        FROM upload_file_morph m
        LEFT JOIN upload_file u
            ON m.upload_file_id = u.id
        WHERE related_type = 'readers' and field = 'avatar'
    ) y
        ON r.id = y.readerID

    LEFT JOIN (
        SELECT r.id as readerID, 
                SUM(IF(ISNULL(bb.id), 0, 1)) as borrowCount, 
                SUM(IF(ISNULL(bb.returnDate) AND bb.id IS NOT NULL, 1, 0)) as borrowingCount
        FROM borrow_books bb
        LEFT JOIN borrows br
         	ON bb.borrow = br.id
        LEFT JOIN readers r
        	ON r.id = br.reader
     	GROUP BY br.reader 
    ) x
        ON r.id = x.readerID
     WHERE ${finalFilter}
     ${generateOrderByQuery(sort, order)}
      LIMIT ${off_set}, ${_pgSize}
   `
    console.log(query1);
    const res = await strapi.connections.default.raw(query1)

    if(readerID) {
        ctx.send({
            data: res[0][0]
        });
    } else {

        const query2 = `
         select count(*) as total_items from readers r
    
         WHERE ${finalFilter}
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



}

module.exports = findReaders;