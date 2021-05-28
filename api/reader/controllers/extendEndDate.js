
const SqlString = require('sqlstring');
const { sanityArrayNum, sanityOrder, sanityString, sanityNumber, escapeString, sanityDate } = require('../../helpers')


const extendEndDate = async (ctx) => {


    let { readerIDs, endDate } = ctx.request.body;
    endDate = sanityDate(endDate);
    readerIDs = sanityArrayNum(readerIDs);

    console.log('endDate', endDate)
    console.log('readerIDs', readerIDs)
    if (readerIDs.length && endDate) {


        const query = `UPDATE readers SET endDate = ${endDate} WHERE id IN(${readerIDs})`
        const res = await strapi.connections.default.raw(query);
        console.log('update endDate query:',query);
        console.log('res[0]', res[0])
      
        ctx.send({
            data: res[0]
        });
    } else {
        
    }

}

module.exports = extendEndDate;