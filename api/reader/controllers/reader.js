'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
 
 var SqlString = require('sqlstring');
 
 const sanityOrder = (order) => {
   order = (order + '').toLowerCase();
   if(order === 'descend' || order==='desc') {
     return 'desc';
   }
   
   if(order === 'ascend' || order === 'asc') return 'asc';
   return '';
 }
 
 const sanityString = (s = '') => {
    if(!s) return '';
    return SqlString.escape(`%${s}%`);
  }
  
 const sanityArrayNum = (arr = []) => {
    if(arr && Array.isArray(arr) && arr.length) {
      arr = arr.filter(e => !isNaN(e)).map(e => +e);
      
      return arr;
    }
    
    return [];
  }

module.exports = {

  async findReaders(ctx, others) {
    
     const generateOrderByQuery = (colName, order) => {
       order = sanityOrder(order);
       console.log('colName:[' + colName + ']');
       if(!order) return '';
       
       if(['name','id', 'address',  'birth', 'course','type','phone','active','startDate', 'endDate'].includes(colName)) {
         return ` ORDER BY ${SqlString.escapeId(colName)} ${order} `
       }
       
       if(colName === 'lop') {
         return ` ORDER BY l.name ${order}`
       }
       
    
       
       return '';
     }
    
    
    
    
    let { name, page = 1, pageSize = 10, order, sort } = ctx.request.body.data;


    order = sanityOrder(order);
    name = sanityString(name);
    
    let _page = isNaN(page) ? 1 : parseInt(page);
    let _pgSize = isNaN(pageSize) ? 10 : parseInt(pageSize);
    const off_set = (_page - 1) * _pgSize;
    
    const nameFilter = name ? `b.name LIKE ${name}`:'';


                    
    const failSafe = nameFilter ? '': '1';
    
    const query1 = `
      SELECT r.id, r.name, r.birth, r.course, r.type, r.active, l.name as lop, l.id as lopID, r.address, r.phone, r.startDate, r.endDate
      FROM readers r
      LEFT JOIN lops l
      ON r.lop = l.id
      ${generateOrderByQuery(sort, order)}
       LIMIT ${off_set}, ${_pgSize}
    `
        console.log(query1);
    const res = await strapi.connections.default.raw(query1)
    
    const query2 = `
      select count(*) as total_items from readers r
      LEFT JOIN lops l
      ON r.lop = l.id

      WHERE ${nameFilter} ${failSafe}
    `;

    const count = await strapi.connections.default.raw(query2)
      
    ctx.send( {
      count: parseInt(count[0][0].total_items), 
      data: res[0]
    });

    
  }
};
