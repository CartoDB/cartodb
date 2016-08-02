var template = require('./no-results.tpl');

/**
 * @param {Object} opts
 * @param {String=} opts.icon
 * @param {String=} opts.title
 * @param {String=} opts.desc
 */

module.exports = function (opts) {
  return template({
    icon: opts.icon || 'CDB-IconFont-cockroach',
    title: opts.title || '',
    desc: opts.desc
  });
};
