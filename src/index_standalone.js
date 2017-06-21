var ACTIVE_LOCALE = 'en';
var Locale = require('./locale/index');
var Polyglot = require('node-polyglot');
var polyglot = new Polyglot({
  locale: ACTIVE_LOCALE, // Needed for pluralize behaviour
  phrases: Locale[ACTIVE_LOCALE]
});
window._t = polyglot.t.bind(polyglot);

var cdb = require('cartodb.js');
cdb.deepInsights = {
  VERSION: require('../package.json').version,
  createDashboard: require('./api/create-dashboard')
};
module.exports = cdb;

