
const SqlString = require('sqlstring');

const deleteCategories = async (ctx) => {


    let { categoryIDs } = ctx.request.body;
    if (Array.isArray(categoryIDs) && categoryIDs.length) {
        categoryIDs = categoryIDs
            .filter(id => id && !isNaN(id))
        categoryIDs = [...new Set(categoryIDs)]

        if (categoryIDs.length) {
            const query = `DELETE FROM categories WHERE id IN (${categoryIDs.join(',')})`
            const res = await strapi.connections.default.raw(query)
            ctx.send({
                data: res[0]
            });
        }
    }

}

module.exports = deleteCategories;