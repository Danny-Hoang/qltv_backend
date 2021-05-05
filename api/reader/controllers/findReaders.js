const SqlString = require('sqlstring');
const { sanityArrayNum, sanityOrder, sanityString, sanityNumber } = require('../../helpers')

const findReaders = async (ctx) => {

    const generateOrderByQuery = (colName, order) => {
        order = sanityOrder(order);
        console.log('colName:[' + colName + ']');
        if (!order) return '';

        if (['name', 'id', 'address', 'birth', 'course', 'type', 'phone', 'active', 'startDate', 'endDate', 'updated_at'].includes(colName)) {
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
     SELECT r.id, r.name, r.birth, r.course, r.type, r.active, l.name as lop, l.id as lopID, r.address, r.phone, r.startDate, r.endDate, r.updated_at
     FROM readers r
     LEFT JOIN lops l
        ON r.lop = l.id
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
    
        ctx.send({
            count: parseInt(count[0][0].total_items),
            data: res[0]
        });
    }



}

module.exports = findReaders;