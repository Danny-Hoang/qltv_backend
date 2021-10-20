const { sanityArrayNum, sanityOrder, sanityString, sanityNumber, escapeString, sanityDate } = require('../../helpers')

const sanityReaders = (data) => {
    if (data && Array.isArray(data)) {
        data = data.map(e => ({
            id: sanityNumber(e.id),
            lopID: sanityNumber(e.lopID),
            phone: escapeString(e.phone),
            course: escapeString(e.course),
            address: escapeString(e.address),
            type: sanityNumber(type),
            birth: sanityDate(e.birth),
            startDate: sanityDate(e.startDate),
            endDate: sanityDate(e.endDate)
        }))

        return data;
    }
}

const updateReaders = async (ctx, others) => {

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

    readers = sanityReaders(readers);

    const updateList = readers.filter(e => e.id && e.name);
    const addList = readers.filter(e => !e.id && e.name);



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


    let updateRes = null;
    let addRes = null;
    if (updateList.length) {
        await strapi.connections.default.raw(`
                    DELETE FROM readers WHERE id IN (${updateList.map(e => e.id)});
               `)

        const valueString = updateList.map(e => {
            return ` (${e.id}, ${e.name}, ${e.lopID}, ${e.startDate}, ${e.endDate}, ${e.phone}, ${e.birth}, ${e.course}) `
        }).join(", ")

        updateRes = await strapi.connections.default.raw(`
                    INSERT INTO readers(id, name, lopID, startDate, endDate, phone, address, birth, course) VALUES ${valueString}
                `)

    }

    if (addList.length) {

        const valueString = addList.map(e => {
            return ` (${e.name}, ${e.lopID}, ${e.startDate}, ${e.endDate}, ${e.phone}, ${e.birth}, ${e.course}) `
        }).join(", ")

        addRes = await strapi.connections.default.raw(`
                    INSERT INTO readers(name, lopID, startDate, endDate, phone, address, birth, course) VALUES ${valueString}
                `)
    }

    ctx.send({
        update: updateRes ? updateRes[0] : null,
        add: addRes ? addRes[0] : null
    });
}


module.exports = updateReaders;