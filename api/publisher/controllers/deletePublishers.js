
const SqlString = require('sqlstring');

const deletePublishers = async (ctx) => {


    let { publisherIDs } = ctx.request.body;
    if (Array.isArray(publisherIDs) && publisherIDs.length) {
        publisherIDs = publisherIDs
            .filter(id => id && !isNaN(id))
        publisherIDs = [...new Set(publisherIDs)]

        if (publisherIDs.length) {
            const query = `DELETE FROM publishers WHERE id IN (${publisherIDs.join(',')})`
            const res = await strapi.connections.default.raw(query)
            ctx.send({
                data: res[0]
            });
        }
    }

}

module.exports = deletePublishers;