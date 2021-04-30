const { sanityArrayNum, sanityOrder, sanityString, escapeString } = require('../../helpers')

const findBookIDAndTitle = async (ctx, others) => {

    let { searchTerm } = ctx.request.body.data;
    if(!searchTerm) return;

    const bookID = isNaN(searchTerm) ? 0 : Number(searchTerm);
    const title = isNaN(searchTerm) ? searchTerm : '';

    // index = isNaN(index) ? 0 : Number(index);
    //MATCH (b.title) AGAINST (${escapeString(title)}  IN NATURAL LANGUAGE MODE) OR
    const titleFilter = title ? `
         b.title LIKE ${sanityString(title)} 
    ` : '1'

    if (bookID) {

        const query = `
        SELECT b.title, b.id, b.author, FROM books b
        
            WHERE b.id = ${bookID}
            
        `
        console.log(query)
        const res = await strapi.connections.default.raw(query)
        ctx.send({
            data: res[0],
        });
    } else if (title) {
        const query = `
            SELECT b.id, b.title,b.author
            FROM books b
            WHERE ${titleFilter}

            LIMIT 0, 10
        `
        console.log(query)
        const res = await strapi.connections.default.raw(query)
        console.log(titleFilter)
        ctx.send({
            data: res[0]
        });
    }
     else {
        ctx.send({
            data: null,
        });
    }
}


module.exports = findBookIDAndTitle;