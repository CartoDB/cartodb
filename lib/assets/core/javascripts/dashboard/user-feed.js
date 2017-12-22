var ACTIVE_LOCALE = window.ACTIVE_LOCALE || 'en';
var Locale = require('../../locale/index');
var Polyglot = require('node-polyglot');
var polyglot = new Polyglot({
  locale: ACTIVE_LOCALE, // Needed for pluralize behaviour
  phrases: Locale[ACTIVE_LOCALE]
});
window._t = polyglot.t.bind(polyglot);

var AuthenticatedUser = require('./common/authenticated-user-model');

var authenticatedUser = new AuthenticatedUser();

authenticatedUser.on('change', function (model) {
  console.log(model);
});

authenticatedUser.fetch();
