
const SqlString = require('sqlstring');
const { sanityArrayNum, sanityOrder, sanityString, sanityNumber, escapeString, sanityDate } = require('../../helpers')


const extendBorrow = async (ctx) => {


    let { borrowBookIDs, days } = ctx.request.body;
    days = sanityNumber(days);
    borrowBookIDs = sanityArrayNum(borrowBookIDs);

    console.log('days', days)
    console.log('borrowBookIDs', borrowBookIDs)
    if (borrowBookIDs.length && days) {


        const query = `UPDATE borrow_books SET maxDays = maxDays + ${days} WHERE id IN(${borrowBookIDs})`
        const res = await strapi.connections.default.raw(query);
        console.log( query);
        console.log('res[0]', res[0])

        ctx.send({
            data: res[0]
        });
    } else {

    }

}

module.exports = extendBorrow;