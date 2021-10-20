const { sanityArrayNum, sanityOrder, sanityString, sanityNumber } = require('../../helpers')

const undoReturnBook = async (ctx, others) => {

    let { borrowBookID } = ctx.request.body;
    borrowBookID = sanityNumber(borrowBookID);

    if (borrowBookID) {

        const query = `
                          UPDATE borrow_books SET returnDate = NULL
                          WHERE id = ${borrowBookID}
                      `
        console.log(query)

        const res = await strapi.connections.default.raw(query)
        ctx.send({
            data: res[0],
        });


    } else {

    }
}


module.exports = undoReturnBook;