const { sanityArrayNum, removeAccents, sanityOrder, sanityString, sanityNumber, escapeString, sanityDate} = require('../../helpers')

const updateReader = async (ctx, others) => {

    let {
        readerID,
        name,
        lop,
        address,
        startDate,
        endDate,
        phone,
        course,
        type,
        birth,
        fileID,
    } = ctx.request.body;

    const name_accent = escapeString(removeAccents(name));

    readerID = sanityNumber(readerID);
    lop = sanityNumber(lop);
    name = escapeString(name);
    phone = escapeString(phone);
    course = escapeString(course);
    type = sanityNumber(type);
    address = escapeString(address);
    birth = sanityDate(birth);
    startDate = sanityDate(startDate);
    endDate = sanityDate(endDate);

    fileID = sanityNumber(fileID);


    if (name && readerID) {

        const query = `
                UPDATE readers
                    SET name=${name}, name_accent=${name_accent}, birth =${birth}, lop=${lop}, course=${course}, type=${type}, startDate=${startDate}, endDate=${endDate}, phone=${phone}
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
                console.log('res3', res3[0])
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



    } else {

    }
}


module.exports = updateReader;