var createCdb = require('./create-cdb');
module.exports = window.cdb = window.cartodb = createCdb({
  jQuery: require('jquery')
});
