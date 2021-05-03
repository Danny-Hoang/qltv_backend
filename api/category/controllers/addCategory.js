const { sanityArrayNum, sanityOrder, sanityString, sanityNumber, escapeString, sanityDate } = require('../../helpers')

const addCategory = async (ctx, others) => {

    let {
        name,
        code,
    } = ctx.request.body;

    name = escapeString(name);
    code = escapeString(code);

    if (name) {
        if (ctx.request && ctx.request.header && ctx.request.header.authorization) {
            const { id, isAdmin } = await strapi.plugins[
                'users-permissions'
            ].services.jwt.getToken(ctx);
            if (id) {
                const query = `
                INSERT INTO categories(
                    name, code,
                    published_at, created_by) VALUES (
                        ${name}, ${code}, 
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


module.exports = addCategory;