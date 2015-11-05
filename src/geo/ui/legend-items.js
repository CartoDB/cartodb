var Backbone = require('backbone');
var LegendItemModel = require('./legend-item-model');

/**
 * Collection of items for a legend
 */
var LegendItems = Backbone.Collection.extend({
  model: LegendItemModel
});

module.exports = LegendItems;
