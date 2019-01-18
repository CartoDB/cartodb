var Backbone = require('backbone');

/**
 * Custom sync method to only allow a single request at a time,
 * any prev ongoing request at a time of a sync call will be aborted.
 *
 * @example
 *   var MyModel = Backbone.Model.extend({
 *     // …
 *     sync: syncAbort,
 */
module.exports = function (method, self, opts) {
  if (this._xhr) {
    this._xhr.abort();
  }

  var xhr = this._xhr = Backbone.Model.prototype.sync.apply(this, arguments);
  xhr.always(function () {
    self._xhr = null;
  });

  return xhr;
};
