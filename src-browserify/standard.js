var createCdb = require('./create-cdb');
module.exports = window.cartodb = createCdb({
  jQuery: require('jquery')
});
