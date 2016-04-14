var cdb = require('cartodb.js');

cdb.deepInsights = {
  VERSION: require('../package.json').version,
  createDashboard: require('./api/create-dashboard')
};

module.exports = cdb;
