var cdb = require('internal-carto.js');
var template = require('./loading.tpl');
var randomQuote = require('./random-quote');

/**
 * @param {Object} opts
 * @param {String=} opts.title
 * @param {String=} opts.desc
 */
module.exports = function (opts) {
  var customDesc = opts.desc && cdb.core.sanitize(opts.desc);

  return template({
    title: opts.title || '',
    descHTML: customDesc || randomQuote()
  });
};
