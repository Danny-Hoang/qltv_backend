'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const findCategories=  require('./findCategories');
const exportCategories=  require('./exportCategories');
const addCategory=  require('./addCategory');
const deleteCategories=  require('./deleteCategories');

module.exports = {
    findCategories,
    addCategory,
    exportCategories,
    deleteCategories
};
