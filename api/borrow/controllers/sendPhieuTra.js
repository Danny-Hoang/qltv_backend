const { sanityArrayNum, sanityOrder, sanityString } = require('../../helpers')

const sendPhieuTra = async (ctx, others) => {

    let { borrowBookIDs } = ctx.request.body.data;

    borrowBookIDs = sanityArrayNum(borrowBookIDs);
    console.log('borrowBookIDs', borrowBookIDs)

    if (borrowBookIDs && borrowBookIDs.length) {
        if (ctx.request && ctx.request.header && ctx.request.header.authorization) {
            const { id, isAdmin } = await strapi.plugins[
                'users-permissions'
            ].services.jwt.getToken(ctx);
            if (id) {
              
                var valueString = borrowBookIDs.join(", ")
                const query = `
                          UPDATE borrow_books SET returnDate = CURRENT_TIMESTAMP
                          WHERE id in (${valueString})
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