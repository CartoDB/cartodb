var Locale = require('../core/locale/index');
var _ = require('underscore');

module.exports = _.extend(Locale, {
  cat: require('./cat.json'),
  en: _.defaults(Locale.en, require('./en.json'))
});
