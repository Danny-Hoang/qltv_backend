const { sanityArrayNum, sanityOrder, sanityString, sanityNumber, escapeString, sanityDate } = require('../../helpers')

const addReader = async (ctx, others) => {

    let {
        name,
        lop,
        address,
        startDate,
        endDate,
        phone,
        course,
        type,
        birth,
    } = ctx.request.body;

    lop = sanityNumber(lop);
    name = escapeString(name);
    phone = escapeString(phone);
    course = escapeString(course);
    type = sanityNumber(type);
    address = escapeString(address);
    birth = sanityDate(birth);
    startDate = sanityDate(startDate);
    endDate = sanityDate(endDate);


    if (name && startDate && endDate) {
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
                INSERT INTO readers(
                    name, birth, lop, course, type, phone, startDate, endDate,
                    published_at, created_by) VALUES (
                        ${name}, ${birth}, ${lop}, ${course}, ${type}, ${phone}, ${startDate}, ${endDate},
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


module.exports = addReader;