const { sanityArrayNum, sanityOrder, sanityString, sanityNumber, escapeString, sanityDate } = require('../../helpers')

const sanityReaders = (data) => {
    if(data && Array.isArray(data)) {
        data = data.map(e => ({
            id: sanityNumber(e.id),
            lopID: sanityNumber(e.lopID),
            phone: escapeString(e.phone),
            course : escapeString(e.course),
            address : escapeString(e.address),
            type : sanityNumber(type),
            birth: sanityDate(e.birth),
            startDate: sanityDate(e.startDate),
            endDate: sanityDate(e.endDate)
        }))

        return data;
    }
}

const updateReader = async (ctx, others) => {

    // readerID,
    // name,
    // lop,
    // address,
    // startDate,
    // endDate,
    // phone,
    // course,
    // type,
    // birth,
    // fileID,
    let {
        readers
    } = ctx.request.body;


    // readerID = sanityNumber(readerID);
    // lop = sanityNumber(lop);
    // name = escapeString(name);
    // phone = escapeString(phone);
    // course = escapeString(course);
    // type = sanityNumber(type);
    // address = escapeString(address);
    // birth = sanityDate(birth);
    // startDate = sanityDate(startDate);
    // endDate = sanityDate(endDate);

    // fileID = sanityNumber(fileID);


    if (readers && Array.isArray(readers)) {
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
                UPDATE readers
                    SET name=${name}, birth =${birth}, lop=${lop}, course=${course}, type=${type}, startDate=${startDate}, endDate=${endDate}, phone=${phone}
                    WHERE id=${readerID}
                
                `;


                console.log(query)

                const res = await strapi.connections.default.raw(query);
                if (fileID) {
                    const query2 = `
                        UPDATE upload_file_morph SET upload_file_id =${fileID} WHERE related_type = 'readers' AND related_id = ${readerID}
                    `
                    console.log(query2)
                    const res2 = await strapi.connections.default.raw(query2);
                    console.log('res2[0', res2[0]);
                    if (res2[0] && !res2[0].affectedRows) {

                        const query3 = `
                        INSERT INTO upload_file_morph 
                                (
                                    upload_file_id, 
                                    related_id, 
                                    related_type, 
                                    field, 
                                    \`order\`
                                )
                            VALUES (
                                ${fileID},
                                ${readerID},
                                'readers',
                                'avatar',
                                1
                            )
                        `
                        const res3 = await strapi.connections.default.raw(query3);
                        console.log('res3',res3[0])
                        ctx.send({
                            data: res3[0],
                        });
                    } else {
                        ctx.send({
                            data: res2[0],
                        });

                    }


                } else {
                    ctx.send({
                        data: res[0],
                    });
                }


            }
        }

    } else {

    }
}


module.exports = updateReader;