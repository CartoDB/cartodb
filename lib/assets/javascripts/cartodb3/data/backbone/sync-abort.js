var cdb = require('cartodb.js');

/**
 * Custom sync method to only allow a single request at a time,
 * any prev ongoing request at a time of a sync call will be aborted.
 *
 * @example
 *   var MyModel = cdb.core.Model.extend({
 *     // …
 *     sync: syncAbort,
 */
module.exports = function (method, self, opts) {
  if (this._xhr) {
    this._xhr.abort();
  }
  this._xhr = cdb.core.Model.prototype.sync.apply(this, arguments);
  this._xhr.always(function () {
    self._xhr = null;
  });
  return this._xhr;
};
