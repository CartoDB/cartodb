var cdb = {};
require('./bundles/add-vendor-libs')(cdb);
require('./bundles/expose-src-libs')(cdb);
window.cartodb = cdb;
module.exports = cdb;
