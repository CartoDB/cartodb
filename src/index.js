var cdb = require('cartodb.js');

cdb.deepInsights = {
  //createDashboard: require('./create-dashboard'),
  createDashboard: require('./api')
};

module.exports = cdb;
