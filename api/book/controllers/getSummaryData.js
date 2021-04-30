const  { sanityArrayNum, sanityOrder, sanityString } = require('../../helpers')

const getSummaryData = async (ctx) => {
    const query1 = `
        SELECT COUNT(*) as total_items 

        FROM instances t 
        
        INNER JOIN (
            SELECT instance as instanceID,  case when MAX(returnDate IS NULL) = 0 THEN max(returnDate) END AS returnDate
            FROM borrow_books
            GROUP BY instance
        ) brb
            ON t.id = brb.instanceID
            WHERE ISNULL(brb.returnDate)
    `;
    const borrow = await strapi.connections.default.raw(query1);
    const query2 = `
        SELECT COUNT(*) as total_items

        FROM instances t WHERE 1;
    `
    const countInstance = await strapi.connections.default.raw(query2);
    const countBook = await strapi.connections.default.raw("SELECT COUNT(*) as total FROM books WHERE 1");

    const query3 = `
        SELECT COUNT(*) as total FROM readers
        `;
    const query4 = `
        SELECT COUNT(*) as total FROM categories
        `
    const query5 = `
        SELECT COUNT(*) as total FROM publishers
        `
    const query6 = `
        SELECT COUNT(*) as total FROM borrow_books
        WHERE isNULL(returnDate)
        `

    const countReader = await strapi.connections.default.raw(query3);
    const countCategory = await strapi.connections.default.raw(query4);
    const countPublisher = await strapi.connections.default.raw(query5);
    const countBorrowing = await strapi.connections.default.raw(query6);

    ctx.send({
        borrow: borrow[0][0].total,
        instance: countInstance[0][0].total_items,
        book: countBook[0][0].total,
        reader: countReader[0][0].total,
        category: countCategory[0][0].total,
        publisher: countPublisher[0][0].total,
        borrowing: countBorrowing[0][0].total,
    });
}

module.exports = getSummaryData;