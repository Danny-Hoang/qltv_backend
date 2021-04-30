const { sanityArrayNum, sanityOrder, sanityString, sanityNumber, escapeString, sanityDate } = require('../../helpers')

const addPublisher = async (ctx, others) => {

    let {
        name,
        address,
    } = ctx.request.body;

    name = escapeString(name);
    address = escapeString(address);

    if (name) {
        if (ctx.request && ctx.request.header && ctx.request.header.authorization) {
            const { id, isAdmin } = await strapi.plugins[
                'users-permissions'
            ].services.jwt.getToken(ctx);
            if (id) {
                const query = `
                INSERT INTO publishers(
                    name, address,
                    published_at, created_by) VALUES (
                        ${name}, ${address}, 
                        CURRENT_TIMESTAMP, ${id}
                    );
                
                `;

                console.log(query)

                const res = await strapi.connections.default.raw(query);

                ctx.send({
                    data: res[0],
                });

            }
        }

    } else {

    }
}


module.exports = addPublisher;