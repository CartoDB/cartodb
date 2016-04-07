var cdb = require('cartodb.js');

cdb.deepInsights = {
  VERSION: require('../package.json').version,
  createDashboard: require('./api')
};

module.exports = cdb;
