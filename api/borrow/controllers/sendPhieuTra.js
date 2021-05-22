const { sanityArrayNum, sanityOrder, sanityString } = require('../../helpers')

const sendPhieuTra = async (ctx, others) => {

    let { instanceIDs } = ctx.request.body.data;

    instanceIDs = sanityArrayNum(instanceIDs);
    console.log('instanceIDs', instanceIDs)

    if (instanceIDs && instanceIDs.length) {
        if (ctx.request && ctx.request.header && ctx.request.header.authorization) {
            const { id, isAdmin } = await strapi.plugins[
                'users-permissions'
            ].services.jwt.getToken(ctx);
            if (id) {
              
                var valueString = instanceIDs.join(", ")
                const query = `
                          UPDATE borrow_books SET returnDate = CURRENT_TIMESTAMP
                          WHERE ISNULL(returnDate) AND instance in (${valueString})
                      `

                console.log(query)

                const res = await strapi.connections.default.raw(query)
                ctx.send({
                    data: res[0],
                });

            }
        }

    } else {

    }
}


module.exports = sendPhieuTra;