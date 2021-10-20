const SqlString = require('sqlstring');
const { sanityArrayNum, sanityOrder, sanityString, sanityNumber, escapeString, sanityDate } = require('../../helpers')

const reportBook = async (ctx, others) => {

    let { instanceIDs, status, reportDate, note } = ctx.request.body;
    instanceIDs = sanityArrayNum(instanceIDs);
    status = sanityNumber(status);
    note = escapeString(note);
    reportDate = sanityDate(reportDate);
    if (instanceIDs.length && reportDate) {

        if (ctx.request && ctx.request.header && ctx.request.header.authorization) {
            const { id, isAdmin } = await strapi.plugins[
                'users-permissions'
            ].services.jwt.getToken(ctx);
            if (id) {

                const query = `UPDATE instances SET status=${status}, note=${note}, reportDate=${reportDate} WHERE id IN (${instanceIDs.join(',')})`
                const res= await strapi.connections.default.raw(query)

                // var valueString = instanceIDs.map(instanceID => {
                //     return ` (${instanceID}, ${status}, ${reportDate}, ${note}, CURRENT_TIMESTAMP, ${id}) `
                // }).join(", ");

                // const query2 = `
                //         INSERT INTO instance_statuses(
                //             id, status, reportDate, note, 
                //             published_at, created_by) VALUES ${valueString}`;
                // console.log(query2);

                // const res = await strapi.connections.default.raw(query2)
                ctx.send({
                    data: res[0]
                });
            }
        }

    }


}

module.exports = reportBook;