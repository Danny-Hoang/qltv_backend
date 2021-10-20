const { sanityArrayNum, removeAccents, sanityOrder, sanityString, sanityNumber, escapeString, sanityDateYMD } = require('../../helpers')

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

    const name_accent = escapeString(removeAccents(name));

    name = escapeString(name);
    phone = escapeString(phone);
    course = escapeString(course);
    type = sanityNumber(type);
    address = escapeString(address);
    birth = sanityDateYMD(birth);
    startDate = sanityDateYMD(startDate);
    endDate = sanityDateYMD(endDate);



    if (name && startDate && endDate) {

        //   const authData = await strapi.connections.default.raw(`
        //     SELECT r.type from \`users-permissions_user\` u
        //     INNER JOIN \`users-permissions_role\` r
        //         ON u.role = r.id
        //     WHERE u.id=${id}
        //   `)
        //   console.log(authData[0])
        const query = `
                INSERT INTO readers(
                    name, name_accent, birth, lop, course, type, phone, startDate, endDate) VALUES (
                        ${name}, ${name_accent}, ${birth}, ${lop}, ${course}, ${type}, ${phone}, ${startDate}, ${endDate});
                
                `;

        console.log(query)

        const res = await strapi.connections.default.raw(query);

        ctx.send({
            data: res[0],
        });


    } else {

    }
}


module.exports = addReader;