
const SqlString = require('sqlstring');

const deleteInstances = async (ctx) => {


    let { instanceIDs } = ctx.request.body;
    if (Array.isArray(instanceIDs) && instanceIDs.length) {
        instanceIDs = instanceIDs
            .filter(id => id && !isNaN(id))
        instanceIDs = [...new Set(instanceIDs)]

        if (instanceIDs.length) {
            const query = `DELETE FROM instances WHERE id IN (${instanceIDs.join(',')})`
            const res = await strapi.connections.default.raw(query)
            ctx.send({
                data: res[0]
            });
        }
    }

}

module.exports = deleteInstances;