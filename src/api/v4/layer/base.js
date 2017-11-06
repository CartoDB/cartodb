var _ = require('underscore');
var Backbone = require('backbone');

/**
 * Base layer object
 *
 * @constructor
 * @abstract
 * @memberof carto.layer
 * @api
 */
function Base () {}

_.extend(Base.prototype, Backbone.Events);

module.exports = Base;
