'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
 
const findReaders = require('./findReaders');
const addReader = require('./addReader');
const deleteReaders = require('./deleteReaders');
const deleteReader = require('./deleteReader');
const updateReader = require('./updateReader');
module.exports = {
  findReaders,
  addReader,
  deleteReaders,
  deleteReader,
  updateReader
};
