const { sanityArrayNum, sanityOrder, sanityString, dmyToYmD } = require('../../helpers')

const deleteBorrows = async (ctx, others) => {

    let { borrowIDs } = ctx.request.body.data;

    borrowIDs = sanityArrayNum(borrowIDs);
    console.log('borrowIDs', borrowIDs)

    if (borrowIDs && borrowIDs.length) {

        const res = await strapi.connections.default.raw(`
            DELETE FROM borrow_books WHERE borrow IN (${borrowIDs.join(',')})
        `)
        const res2 = await strapi.connections.default.raw(`
            DELETE FROM borrows WHERE id IN (${borrowIDs.join(',')})
        `)

        ctx.send({
            data: res[0],
        });


    }

}
module.exports = deleteBorrows;