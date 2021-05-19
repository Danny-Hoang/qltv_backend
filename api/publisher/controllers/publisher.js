'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
const findPublishers = require('./findPublishers');
const addPublisher = require('./addPublisher');
const exportPublishers = require('./exportPublishers');
const deletePublishers = require('./deletePublishers');

module.exports = {
  findPublishers,
  addPublisher,
  exportPublishers,
  deletePublishers
};
