const  { sanityArrayNum, sanityOrder, sanityString } = require('../../helpers')

const getPublishersAndCategories = async (ctx) => {

    const res1 = await strapi.connections.default.raw(`SELECT id, name, code FROM categories WHERE 1`);
    const res2 = await strapi.connections.default.raw(`SELECT id, name, address FROM publishers WHERE 1`);
    const res3 = await strapi.connections.default.raw(`SELECT DISTINCT publishPlace FROM books WHERE publishPlace <> ''`);
    const res4 = await strapi.connections.default.raw(`SELECT DISTINCT size FROM books WHERE size <> ''`);
    const res5 = await strapi.connections.default.raw(`SELECT DISTINCT author FROM books WHERE author <> ''`);
    const res6 = await strapi.connections.default.raw(`SELECT DISTINCT code FROM books WHERE code <> ''`);
    const res7 = await strapi.connections.default.raw(`SELECT id, name FROM lops WHERE 1 <> ''`);

    ctx.send({
        categories: res1[0],
        publishers: res2[0],
        lops: res7[0],
        publishPlaces: res3[0].map(e => e.publishPlace),
        sizes: res4[0].map(e => e.size),
        authors: res5[0].map(e => e.author),
        codes: res6[0].map(e => e.code),
    });
}

module.exports = getPublishersAndCategories;