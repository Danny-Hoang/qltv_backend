
const SqlString = require('sqlstring');

const deleteReader = async (ctx) => {


    let { readerID } = ctx.request.body;
    readerID = Number(readerID) || 0;
    if (readerID) {
        const query = `SELECT COUNT(*) as total_items FROM borrows WHERE reader = ${readerID}`
        const res = await strapi.connections.default.raw(query);
        console.log('res[0]', res[0])
        if (res[0] && res[0][0] && res[0][0].total_items === 0) {
            const res1 = await strapi.connections.default.raw(`DELETE FROM readers WHERE id=${readerID}`);
            ctx.send({
                data: res[1]
            });
        }
        // const query = `DELETE FROM readers WHERE id IN (${readerIDs.join(',')})`
        // const res = await strapi.connections.default.raw(query)

    }

}

module.exports = deleteReader;