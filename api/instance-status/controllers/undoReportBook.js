const SqlString = require('sqlstring');
const { sanityArrayNum, sanityOrder, sanityString, sanityNumber, escapeString, sanityDate } = require('../../helpers')

const undoReportBook = async (ctx, others) => {

    let { instanceIDs } = ctx.request.body;
    instanceIDs = sanityArrayNum(instanceIDs);

    if (instanceIDs.length) {

        const query = `DELETE FROM instance_statuses WHERE id IN (${instanceIDs.join(',')})`
        const res = await strapi.connections.default.raw(query)

        ctx.send({
            data: res[0]
        });

    }


}

module.exports = undoReportBook;