var cdb = {};
require('./add-vendor-libs')(cdb);
window.cartodb = cdb;
module.exports = cdb;
