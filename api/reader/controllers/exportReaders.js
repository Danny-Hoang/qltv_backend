const SqlString = require('sqlstring');
const { sanityArrayNum, sanityOrder, sanityString, sanityNumber } = require('../../helpers')

const exportReaders = async (ctx) => {


    const query1 = `
     SELECT r.id, r.name, r.birth, r.course, r.type, r.active, l.name as lop, l.id as lopID, r.address, r.phone, r.startDate, r.endDate, r.updated_at
     FROM readers r
     LEFT JOIN lops l
        ON r.lop = l.id
     WHERE 1
   `

    const res = await strapi.connections.default.raw(query1)

    ctx.send({
        data: res[0]
    });



}

module.exports = exportReaders;