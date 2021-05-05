const { sanityArrayNum, sanityOrder, sanityString, sanityNumber, escapeString } = require('../../helpers')

const addBook = async (ctx, others) => {

    let {
        title,
        publishPlace,
        publisher,
        category,
        price,
        size,
        quantity,
        totalPage,
        author,
        code,
        publishYear
    } = ctx.request.body.data;

    category = sanityNumber(category);
    publisher = sanityNumber(publisher);
    price = sanityNumber(price);
    size = sanityNumber(size);
    quantity = sanityNumber(quantity);
    size = sanityNumber(size);
    totalPage = sanityNumber(totalPage);
    publishYear = sanityNumber(publishYear);
    title = escapeString(title);
    author = escapeString(author);
    publishPlace = escapeString(publishPlace);
    code = escapeString(code);

    if (title) {
        if (ctx.request && ctx.request.header && ctx.request.header.authorization) {
            const { id, isAdmin } = await strapi.plugins[
                'users-permissions'
            ].services.jwt.getToken(ctx);
            if (id) {
                //   const authData = await strapi.connections.default.raw(`
                //     SELECT r.type from \`users-permissions_user\` u
                //     INNER JOIN \`users-permissions_role\` r
                //         ON u.role = r.id
                //     WHERE u.id=${id}
                //   `)
                //   console.log(authData[0])
                const query = `
                INSERT INTO books(
                    title, code, author, totalPage, category, publisher,
                    publishPlace, publishYear, price, size, importDate,
                    published_at, created_by) VALUES (
                        ${title}, ${code}, ${author}, ${totalPage}, ${category}, ${publisher},
                        ${publishPlace}, ${publishYear}, ${price}, ${size}, CURRENT_DATE(),
                        CURRENT_TIMESTAMP, ${id}
                    );
                
                `;

                console.log(query);
                const res1 = await strapi.connections.default.raw(query);
                if (res1[0] && res1[0].insertId) {
                    const lastID = res1[0].insertId;
                    let instanceIndexes = Array.from(Array(quantity).keys()).map(e => e + 1)
                    if (quantity > 0) {

                        var valueString = instanceIndexes.map(index => {
                            return ` (${lastID}, ${index}, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ${id}) `
                        }).join(", ")
                        const query2 = "INSERT INTO instances(book, `index`, `status`, importDate, published_at, created_by) VALUES" + `${valueString}`

                        console.log(query2)

                        const res = await strapi.connections.default.raw(query2)
                        ctx.send({
                            data: res[0],
                        });
                    } else {
                        ctx.send({
                            data: res1[0],
                        });
                    }

                }
                //   const query = `
                //       INSERT INTO borrows(reader, date, published_at, created_by) VALUES (${readerID}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ${id});
                //   `;

                //   console.log(query);
            }
        }

    } else {

    }
}


module.exports = addBook;