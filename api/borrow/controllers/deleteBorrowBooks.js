const { sanityArrayNum, sanityOrder, sanityString, dmyToYmD } = require('../../helpers')

const deleteBorrowBooks = async (ctx, others) => {

    let { borrowBookIDs } = ctx.request.body.data;

    borrowBookIDs = sanityArrayNum(borrowBookIDs);
    console.log('borrowBookIDs', borrowBookIDs)

    if (borrowBookIDs && borrowBookIDs.length) {

        //lấy ra list borrowIDs từ list borrowBookIDs
        const res2 = await strapi.connections.default.raw(`
            SELECT br.id as borrowID FROM borrows br 
            LEFT JOIN  borrow_books bb 
                ON bb.borrow = br.id
            WHERE bb.id IN (${borrowBookIDs.join(',')})
            GROUP BY br.id
        `)

        //xóa list borrow_books 
        const res = await strapi.connections.default.raw(`
            DELETE FROM borrow_books WHERE id IN (${borrowBookIDs.join(',')})
        `)

        const borrowIDs = res2[0].map(e => e.borrowID).filter(id => id);

        //lấy ra list borrowIDs mà ko còn borrow_book nào nữa
        const res3 = await strapi.connections.default.raw(`
            SELECT br.id as borrowID FROM borrows br 
            LEFT JOIN  borrow_books bb 
                ON bb.borrow = br.id
            WHERE br.id IN (${borrowIDs.join(',')})
            GROUP BY br.id
                HAVING COUNT(bb.borrow) = 0
        `)

        //xóa list borrows nếu thỏa mãn đk trên
        if (res3[0] && res3[0].length) {
            const deletetingList = res3[0].map(e => e.borrowID).filter(id => id);
            if (deletetingList.length) {
                await strapi.connections.default.raw(`DELETE FROM borrows WHERE id IN (${deletetingList.join(',')})`)
                console.log(`deleted ${deletetingList}`)
            } else {
                console.log('no borrow deleted')
            }
        }

        console.log(res[0])

        ctx.send({
            data: res[0],
        });


    }

}
module.exports = deleteBorrowBooks;