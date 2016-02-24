var _ = require('underscore');
var Backbone = require('backbone');

module.exports = Backbone.Collection.extend({

  /**
   * @param  {Array.<Filter>} filters Array with the filters to add to the collection.
   * @param  {Array.<LayerModel>} layers  Array of LayerModel in the same order passed to the WindshaftMap.
   * @returns {WindshaftFilterCollection}
   */
  initialize: function (filters, layers) {
    this.layers = layers;
    Backbone.Collection.prototype.initialize.apply(this, filters);
  },

  toJSON: function () {
    var json = {};
    var activeFilters = this.getActiveFilters();
    if (activeFilters.length) {
      json.layers = [];
      var l, f, filters, filtersJson;
      for (l = 0; l < this.layers.length; l++) {
        var layer = this.layers[l];
        if (layer.isVisible()) {
          filters = this.getActiveFiltersForLayer(layer);
          filtersJson = {};
          if (filters.length) {
            for (f = 0; f < filters.length; f++) {
              _.extend(filtersJson, filters[f].toJSON());
            }
          }
          json.layers.push(filtersJson);
        }
      }
    }
    return json;
  },

  getActiveFilters: function () {
    return this.filter(function (filter) {
      return !filter.isEmpty();
    });
  },

  getActiveFiltersForLayer: function (layer) {
    return this.filter(function (filter) {
      return !filter.isEmpty() && filter.get('layer') === layer;
    });
  }
});
