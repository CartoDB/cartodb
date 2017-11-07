var _ = require('underscore');
var Backbone = require('backbone');

/**
 * Base filter object
 *
 * @constructor
 * @abstract
 * @memberof carto.filter
 * @api
 */
function Base () {}

_.extend(Base.prototype, Backbone.Events);

module.exports = Base;
