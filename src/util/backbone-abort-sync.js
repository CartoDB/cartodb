var Backbone = require('backbone');

/**
 * Abort ongoing request if it exists
 */
module.exports = function (method, model, options) {
  var self = arguments[1];

  if (this._xhr) {
    this._xhr.abort();
  }
  this._xhr = Backbone.sync.apply(this, arguments);
  this._xhr.always(function () {
    self._xhr = null;
  });
  return this._xhr;
};
