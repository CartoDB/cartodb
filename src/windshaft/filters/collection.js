var _ = require('underscore');
var Backbone = require('backbone');

module.exports = Backbone.Collection.extend({
  initialize: function (filters, layers) {
    this.layers = layers;
    Backbone.Collection.prototype.initialize.apply(this, filters);
  },

  toJSON: function () {
    var json = {};
    var activeFilters = this.getActiveFilters();
    if (activeFilters.length) {
      json.layers = [];
      _.each(activeFilters, function (filter) {
        var index = filter.get('layerIndex');
        if (index >= 0) {
          if (json.layers[index]) {
            _.extend(json.layers[index], filter.toJSON());
          } else {
            json.layers[index] = filter.toJSON();
          }
        } else {
          throw new Error('layerIndex missing for filter ' + JSON.stringify(filter.toJSON()));
        }
      });
      // fill the holes only if layer is visible, otherwise remove the hole.
      for (var i = 0; i < json.layers.length; ++i) {
        if (this.layers[i].isVisible()) {
          json.layers[i] = json.layers[i] || {};
        } else {
          json.layers.splice(i, 1);
        }
      }
    }

    return json;
  },

  getActiveFilters: function () {
    return this.filter(function (filter) {
      return !filter.isEmpty();
    });
  }
});
