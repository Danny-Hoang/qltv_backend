'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const findInstances = require('./findInstances');
const getAllBorrowBooks = require('./getAllBorrowBooks');
const findBooks = require('./findBooks');
const findBook = require('./findBook');
const getSummaryData = require('./getSummaryData')
const getBorrowingBooks = require('./getBorrowingBooks');
const findBookOrReaderByName = require('./findBookOrReaderByName');
const getPublishersAndCategories = require('./getPublishersAndCategories');
const addBook = require('./addBook');
const getBook = require('./getBook');
const findBookIDAndTitle = require('./findBookIDAndTitle');
const findAvailableBook = require('./findAvailableBook');
const findReaderAndBorrowingBooks = require('./findReaderAndBorrowingBooks');
const getInstanceBorrowHistory = require('./getInstanceBorrowHistory');
const findReaderAndBorrowHistory = require('./findReaderAndBorrowHistory');
const addInstances = require('./addInstances');


module.exports = {
    findBook,
    findBooks,
    findInstances,
    getSummaryData,
    getAllBorrowBooks,
    getBorrowingBooks,
    findBookOrReaderByName,
    getPublishersAndCategories,
    addBook,
    getBook,
    findBookIDAndTitle,
    findAvailableBook,
    findReaderAndBorrowingBooks,
    getInstanceBorrowHistory,
    findReaderAndBorrowHistory,
    addInstances
};
