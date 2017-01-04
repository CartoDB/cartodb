var Locale = require('../core/locale/index');
var _ = require('underscore');

function deepObjectExtend (target, source) {
  for (var prop in source) {
    if (source.hasOwnProperty(prop)) {
      if (target[prop] && typeof source[prop] === 'object') {
        deepObjectExtend(target[prop], source[prop]);
      }
      else {
        target[prop] = source[prop];
      }
    }
  }

  return target;
}

module.exports = _.extend(Locale, {
  en: deepObjectExtend(Locale.en, require('./en.json'))
});
