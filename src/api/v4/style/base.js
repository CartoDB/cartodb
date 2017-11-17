var _ = require('underscore');
var Backbone = require('backbone');

/**
 * Base style object.
 *
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

module.exports = Base;
