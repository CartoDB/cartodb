const Polyglot = require('node-polyglot');

const Locale = require('./index');

const ACTIVE_LOCALE = window.ACTIVE_LOCALE || 'cs';

const polyglot = new Polyglot({
  locale: ACTIVE_LOCALE,
  phrases: Locale[ACTIVE_LOCALE]
});

window._t = polyglot.t.bind(polyglot);



