import deepObjectExtend from 'new-dashboard/utils/deep-object-extend';

var ACTIVE_LOCALE = 'en';
if (ACTIVE_LOCALE !== 'en') {
  require('moment/locale/' + ACTIVE_LOCALE);
}

var Locale = require('locale/index');
var Polyglot = require('node-polyglot');

// Override original translation strings
const overrideTranslationStrings = require('./locales/en.overrides.json');
Locale.en = deepObjectExtend(Locale.en, overrideTranslationStrings);

var polyglot = new Polyglot({
  locale: ACTIVE_LOCALE, // Needed for pluralize behaviour
  phrases: Locale[ACTIVE_LOCALE]
});

window._t = polyglot.t.bind(polyglot);
