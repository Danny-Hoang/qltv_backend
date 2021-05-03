const { sanityArrayNum, sanityOrder, sanityString, sanityNumber, escapeString } = require('../../helpers')

const addInstances = async (ctx, others) => {

    let {
        bookID,
        count,
    } = ctx.request.body;

    bookID = sanityNumber(bookID);
    count = sanityNumber(count);

    if (bookID && count) {
        if (ctx.request && ctx.request.header && ctx.request.header.authorization) {
            const { id, isAdmin } = await strapi.plugins[
                'users-permissions'
            ].services.jwt.getToken(ctx);
            if (id) {
             
                const query = `
                    SELECT MAX(t.index) as currentIndex FROM books b
                    INNER JOIN instances t
                        ON b.id = t.book
                    
                    WHERE b.id = ${bookID}
                    GROUP BY t.book
                `;

                console.log(query);
                const res1 = await strapi.connections.default.raw(query);
                const currentIndex = res1[0][0].currentIndex;
                const nextIndexes = Array.from(Array(count).keys()).map(e => e + currentIndex + 1)

                var valueString = nextIndexes.map(index => {
                    return ` (${bookID}, ${index}, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ${id}) `
                }).join(", ")
                const query2 = "INSERT INTO instances(book, `index`, `status`, importDate, published_at, created_by) VALUES" + `${valueString}`

                console.log(query2)

                const res = await strapi.connections.default.raw(query2)
                ctx.send({
                    data: res[0],
                });


            }
        }

    } else {

    }
}


module.exports = addInstances;