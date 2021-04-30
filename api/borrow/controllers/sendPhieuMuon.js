const  { sanityArrayNum, sanityOrder, sanityString } = require('../../helpers')

const sendPhieuMuon = async (ctx, others) => {

    let { instanceIDs, readerID, timeNum } = ctx.request.body.data;
    



    instanceIDs = sanityArrayNum(instanceIDs);
    readerID = isNaN(readerID) ? 0 : Number(readerID);
    console.log('instanceIDs',instanceIDs)
    console.log('readerID',readerID)

    if(readerID && instanceIDs.length) {
        if (ctx.request && ctx.request.header && ctx.request.header.authorization) {
            const { id, isAdmin } = await strapi.plugins[
                'users-permissions'
              ].services.jwt.getToken(ctx);
              if(id) {
                //   const authData = await strapi.connections.default.raw(`
                //     SELECT r.type from \`users-permissions_user\` u
                //     INNER JOIN \`users-permissions_role\` r
                //         ON u.role = r.id
                //     WHERE u.id=${id}
                //   `)
                //   console.log(authData[0])
                const query = `
                INSERT INTO borrows(reader, date, published_at, created_by) VALUES (${readerID}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ${id});
                
                `;
                const res1 = await strapi.connections.default.raw(query);
                if(res1[0] && res1[0].insertId) {
                    const lastID = res1[0].insertId;
                    var valueString = instanceIDs.map(instance => {
                        return ` (${lastID}, NULL, ${instance}, CURRENT_TIMESTAMP, ${id}) `
                    }).join(", ")
                      const query2 = `
                          INSERT INTO borrow_books(borrow, returnDate, instance, published_at, created_by)
                          VALUES ${valueString};
                      `

                      console.log(query2)

                      const res = await strapi.connections.default.raw(query2)
                      ctx.send({
                          data: res[0],
                      });
                }
                //   const query = `
                //       INSERT INTO borrows(reader, date, published_at, created_by) VALUES (${readerID}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ${id});
                //   `;

                //   console.log(query);
              }
        }

    } else {
       
    }
}


module.exports = sendPhieuMuon;