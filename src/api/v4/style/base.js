var _ = require('underscore');
var Backbone = require('backbone');

/**
 * Base style object.
 *
 * @fires error
 * @constructor
 * @abstract
 * @memberof carto.style
 * @api
 */
function Base () {}

_.extend(Base.prototype, Backbone.Events);

Base.prototype.$setError = function (cartoError) {
  this._error = cartoError;
  this.trigger('error', cartoError);
};

Base.prototype.$setEngine = function (newEngine) {
  if (this._engine && this._engine !== newEngine) {
    throw new Error('CartoCSS engine cannot be changed');
  }
  this._engine = newEngine;
};

Base.prototype.$getEngine = function () {
  return this._engine;
};

module.exports = Base;
