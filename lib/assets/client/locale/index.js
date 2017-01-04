var Locale = require('../core/locale/index');
var _ = require('underscore');
var $ = require('jquery');

module.exports = _.extend(Locale, {
  sw: require('../core/locale/sw.json'),
  es: require('../core/locale/es.json'),
  en: $.extend(true, Locale.en, require('./en.json'))
});
