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

  async bookByInstance(ctx) {
    const query = `
      SELECT b.id, COUNT(t.book) as total 
      FROM books b 
      LEFT JOIN instances t ON b.id = t.book
      
      GROUP BY b.id
      HAVING total > 0
    `;
    
    const res = await strapi.connections.default.raw(query);
    const data = res[0].map(e => ({ ...e, total: +e.total}))
    ctx.send(data);
  },
  async findBooks(ctx, others) {
    
     const generateOrderByQuery = (colName, order) => {
       order = sanityOrder(order);
       console.log('colName:[' + colName + ']');
       if(!order) return '';
       
       if(['title','id', 'author', 'price', 'totalPage', 'code','publishYear','size','quantity', 'barcode'].includes(colName)) {
         return ` ORDER BY ${SqlString.escapeId(colName)} ${order} `
       }
       
       if(colName === 'category') {
         return ` ORDER BY c.name ${order}`
       }
       
       if(colName === 'publisher') {
         return ` ORDER BY p.name ${order}`
       }
       
       return '';
     }
    
    
    
    
    let { categories, author, code, publishers, title, page = 1, pageSize = 10, order, sort } = ctx.request.body.data;


    order = sanityOrder(order);
    title = sanityString(title);
    code = sanityString(code);
    author = sanityString(author);
    categories = sanityArrayNum(categories);
    publishers = sanityArrayNum(publishers);
    
    
    let _page = isNaN(page) ? 1 : parseInt(page);
    let _pgSize = isNaN(pageSize) ? 10 : parseInt(pageSize);
    const off_set = (_page - 1) * _pgSize;
    
    const titleFilter = title ? `b.title LIKE ${title}`:'';
    const codeFilter = code ? `b.code LIKE ${code}`:'';
    const authorFilter = author? `b.author LIKE ${author}`:''

    const categoryFilter = categories && categories.length ? `c.id IN (${categories.join(',')})` : '';
    const joinCategory = `LEFT JOIN categories c ON b.category = c.id`
    
    const publisherFilter = publishers && publishers.length ? `p.id IN (${publishers.join(',')})` : '';
    const joinPublisher = `LEFT JOIN publishers p on b.publisher = p.id`;

    const finalFilter = [titleFilter, codeFilter, authorFilter, categoryFilter, publisherFilter]
                    .filter(e => e)
                    .join(' AND ');
                    console.log('final filter:');
                    console.log(finalFilter);
                    
    const failSafe = finalFilter ? '': '1';
    
    const query1 = `
      select b.id, b.title, b.code, b.publisher as publisherID, p.name as publisher, b.publishYear, b.category as categoryID, 
      c.name as category, b.author, b.size, b.price, b.totalPage, b.updated_at, COUNT(t.book) as quantity  from books b 
        ${joinCategory}
        ${joinPublisher}
        LEFT JOIN instances t
        ON b.id = t.book
        
      WHERE ${finalFilter} ${failSafe}
      GROUP BY b.id
      HAVING quantity >= 0
      ${generateOrderByQuery(sort, order)}
       LIMIT ${off_set}, ${_pgSize}
    `
        console.log(query1);
    const res = await strapi.connections.default.raw(query1)

    
    const query2 = `
      select count(*) as total_items from books b 
      ${joinCategory}
        ${joinPublisher}
      WHERE ${finalFilter} ${failSafe}
    `;

    const count = await strapi.connections.default.raw(query2)
      
    ctx.send( {
      count: parseInt(count[0][0].total_items), 
      data: res[0]
    });

    
  },
  async findInstances(ctx) {
    
      const generateOrderByQuery = (colName, order) => {
       order = sanityOrder(order);
       console.log('colName:[' + colName + ']');
       if(!order) return '';
       
       if(['title', 'author', 'price', 'totalPage', 'code','publishYear','size', 'category', 'publisher'].includes(colName)) {
         return ` ORDER BY ${SqlString.escapeId(colName)} ${order} `
       }
       
      if(colName ==='barcode') {
        return ` ORDER BY bookID ${order}`
      }
       
       return '';
     }
    
    
    let { categories, author, code, publishers, title, page = 1, pageSize = 10, order, sort } = ctx.request.body.data;


    order = sanityOrder(order);
    title = sanityString(title);
    code = sanityString(code);
    author = sanityString(author);
    categories = sanityArrayNum(categories);
    publishers = sanityArrayNum(publishers);
    
    
    let _page = isNaN(page) ? 1 : parseInt(page);
    let _pgSize = isNaN(pageSize) ? 10 : parseInt(pageSize);
    const off_set = (_page - 1) * _pgSize;
    
    const titleFilter = title ? `b.title LIKE ${title}`:'';
    const codeFilter = code ? `b.code LIKE ${code}`:'';
    const authorFilter = author? `b.author LIKE ${author}`:''

    const categoryFilter = categories && categories.length ? `b.categoryID IN (${categories.join(',')})` : '';

    
    const publisherFilter = publishers && publishers.length ? `b.publisherID IN (${publishers.join(',')})` : '';


    const finalFilter = [titleFilter, codeFilter, authorFilter, categoryFilter, publisherFilter]
                    .filter(e => e)
                    .join(' AND ');
                    
    const failSafe = finalFilter ? '': '1';
    
    const query1 = `
    
    
      select t.id, b.id as bookID, b.title, b.code, 
             p.id as  publisherID, p.name as publisher, c.id as categoryID, c.name as category, b.publishYear, 
             b.author, b.price, b.size, b.totalPage, t.index, brb.returnDate, brb.borrowCount
 
      FROM instances t 
      INNER JOIN books b
      ON b.id = t.book
      LEFT JOIN categories c 
      ON b.category = c.id
      LEFT JOIN publishers p 
      ON b.publisher = p.id
      
      LEFT JOIN (
      	SELECT instance as instanceID, borrow as borrowID, 
          COUNT(*) as borrowCount, case when MAX(returnDate IS NULL) = 0 THEN max(returnDate) END AS returnDate
        FROM borrow_books
        GROUP BY instance
      ) brb
      	ON t.id = brb.instanceID
      

        
      WHERE ${finalFilter} ${failSafe}

      ${generateOrderByQuery(sort, order)}
       LIMIT ${off_set}, ${_pgSize}
    `
        console.log(query1);
    const res = await strapi.connections.default.raw(query1)

    
    const query2 = `
      select COUNT(*) as total_items
 
      FROM instances t 
      INNER JOIN books b
      ON b.id = t.book
      LEFT JOIN categories c 
      ON b.category = c.id
      LEFT JOIN publishers p 
      ON b.publisher = p.id
      


      WHERE ${finalFilter} ${failSafe}
    `

    const count = await strapi.connections.default.raw(query2)
      
    ctx.send( {
      count: parseInt(count[0][0].total_items), 
      data: res[0]
    });

    
  },
  async getSummaryData(ctx) {
    const query1 = `
      select COUNT(*) as total_items 
 
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
      select COUNT(*) as total_items
 
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
  },
  async getAllBorrowBooks(ctx) {
  
    const generateOrderByQuery = (colName, order) => {
       order = sanityOrder(order);
       console.log('colName:[' + colName + ']');
       if(!order) return '';
       
       if(['bookID', 'bookTitle', 'category', 'phone', 'author', 'reader','lop','type', 'borrowDate', 'returnDate'].includes(colName)) {
         return ` ORDER BY ${SqlString.escapeId(colName)} ${order} `
       }
       
       return '';
     }
    
    
    let { bookTitle, reader, author, publishers, categories, page = 1, pageSize = 10, order, sort } = ctx.request.body.data;


    order = sanityOrder(order);
    bookTitle = sanityString(bookTitle);
    reader = sanityString(reader);
    author = sanityString(author);
    categories = sanityArrayNum(categories);
    publishers = sanityArrayNum(publishers);
    
    
    let _page = isNaN(page) ? 1 : parseInt(page);
    let _pgSize = isNaN(pageSize) ? 10 : parseInt(pageSize);
    const off_set = (_page - 1) * _pgSize;
    
    const bookTitleFilter = bookTitle ? `b.title LIKE ${bookTitle}`:'';
    const readerFilter = reader ? `r.name LIKE ${reader}`:'';
    const authorFilter = author? `b.author LIKE ${author}`:''

    const categoryFilter = categories && categories.length ? `b.categoryID IN (${categories.join(',')})` : '';

    
    const publisherFilter = publishers && publishers.length ? `b.publisherID IN (${publishers.join(',')})` : '';


    const finalFilter = [bookTitleFilter, readerFilter, authorFilter, categoryFilter, publisherFilter]
                    .filter(e => e)
                    .join(' AND ');
                    
    const failSafe = finalFilter ? '': '1';
    const query1 = `
      SELECT b.id as bookID, b.title as bookTitle, b.author, c.name as category, p.name as publisher, t.index, r.name as reader, 
          r.phone, l.name as lop, r.active, r.type, br.date as borrowDate, brb.returnDate
 
      FROM borrow_books brb
      INNER JOIN instances t 
      	ON brb.instance = t.id
      INNER JOIN books b 
      	ON t.book = b.id 
      LEFT JOIN categories c 
        ON b.category = c.id
      LEFT JOIN publishers p
        ON b.publisher = p.id
      
      LEFT JOIN borrows br
      	ON brb.borrow = br.id
      LEFT JOIN readers r 
      	ON r.id = br.reader
      LEFT JOIN lops l 
        ON r.lop = l.id
        
        WHERE ${finalFilter} ${failSafe}

      ${generateOrderByQuery(sort, order)}
       LIMIT ${off_set}, ${_pgSize}
    `;
    
    const query2 = `
      SELECT COUNT(*) as total
 
      FROM borrow_books brb
      INNER JOIN instances t 
      	ON brb.instance = t.id
      INNER JOIN books b 
      	ON t.book = b.id 
      LEFT JOIN categories c 
        ON b.category = c.id
      
      LEFT JOIN borrows br
      	ON brb.borrow = br.id
      LEFT JOIN readers r 
      	ON r.id = br.reader
      LEFT JOIN lops l 
        ON r.lop = l.id
        
        WHERE ${finalFilter} ${failSafe}
    `
    const res = await strapi.connections.default.raw(query1);
    const count = await strapi.connections.default.raw(query2);
    ctx.send({
      count: parseInt(count[0][0].total_items), 
      data: res[0]
    });
  },
  async getBorrowingBook(ctx) {
    const query = `
    select b.id as bookID, b.title as bookTitle, c.name as category, t.index, r.name as reader, 
          r.phone, l.name as lop, r.active, r.type, br.date as borrowDate  
 
      FROM instances t 
      INNER JOIN books b 
      	ON t.book = b.id 
      LEFT JOIN categories c 
        ON b.category = c.id
      
      INNER JOIN (
      	SELECT instance as instanceID, borrow, 
        case when MAX(returnDate IS NULL) = 0 THEN max(returnDate) END AS returnDate
        FROM borrow_books
        GROUP BY instance
      ) brb
      	ON t.id = brb.instanceID
      INNER JOIN borrows br
      	ON brb.borrow = br.id
      INNER JOIN readers r 
      	ON r.id = br.reader
      LEFT JOIN lops l 
        ON r.lop = l.id
      WHERE ISNULL(brb.returnDate)
      
    `;
    const res = await strapi.connections.default.raw(query);
    ctx.send({
      data: res[0]
    });
  }
};
