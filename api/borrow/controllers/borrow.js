'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
 const sendPhieuMuon = require('./sendPhieuMuon');
 const sendPhieuTra = require('./sendPhieuTra');
 const findTickets = require('./findTickets');
module.exports = {
    sendPhieuMuon,
    sendPhieuTra,
    findTickets
};
