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
                    SELECT t.index FROM instances t
                    WHERE t.book = ${bookID} AND t.index > 0
                `;

                const res = await strapi.connections.default.raw(query);
                console.log(res[0])
                const currentIndexes = res[0].map(e => e.index);

                const nextIndexes = []
                for (let i = 1; i <= 250; i++) {
                    if (nextIndexes.length === count) {
                        break;
                    }
                    if (!currentIndexes.includes(i)) {
                        nextIndexes.push(i);
                    }
                }
                // let currentIndex;
                // if(!res1[0][0].currentIndex) {
                //     currentIndex = 0;
                // } else {
                //     currentIndex = res1[0][0].currentIndex;
                // }

                // const nextIndexes = Array.from(Array(count).keys()).map(e => e + currentIndex + 1)

                var valueString = nextIndexes.map(index => {
                    return ` (${bookID}, ${index}, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ${id}) `
                }).join(", ")
                const query2 = "INSERT INTO instances(book, `index`, `status`, importDate, published_at, created_by) VALUES" + `${valueString}`

                console.log(query2)

                await strapi.connections.default.raw(query2);
                await strapi.connections.default.raw(`UPDATE books SET importDate=CURDATE() WHERE id=${bookID}`)
                ctx.send(nextIndexes);


            }
        }

    } else {

    }
}


module.exports = addInstances;