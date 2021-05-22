
const SqlString = require('sqlstring');

const deleteReaders = async (ctx) => {


    let { readerIDs } = ctx.request.body;
    if (Array.isArray(readerIDs) && readerIDs.length) {
        readerIDs = readerIDs
            .filter(id => id && !isNaN(id))
        readerIDs = [...new Set(readerIDs)]

        if (readerIDs.length) {
            const query = `SELECT id FROM borrows WHERE reader IN (${readerIDs.join(',')})`
            const res = await strapi.connections.default.raw(query);
            console.log('res[0]',res[0])
            if(res[0] && res[0].length) {
                const borrowIDs = res[0].map(e => e.id);
                console.log('borrowIDs',borrowIDs)

                // const res1 = await strapi.connections.default.raw(``);
            }
            // const query = `DELETE FROM readers WHERE id IN (${readerIDs.join(',')})`
            // const res = await strapi.connections.default.raw(query)
            ctx.send({
                data: res[0]
            });
        }
    }

}

module.exports = deleteReaders;