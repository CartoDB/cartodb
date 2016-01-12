var _ = require('underscore');
var Backbone = require('backbone');

module.exports = Backbone.Collection.extend({
  toJSON: function () {
    var json = {};
    var activeFilters = this.getActiveFilters();
    if (activeFilters.length) {
      json.layers = [];
      _.each(activeFilters, function (filter) {
        if (!filter.isEmpty()) {
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
        }
      });
      // fill the holes
      for (var i = 0; i < json.layers.length; ++i) {
        json.layers[i] = json.layers[i] || {};
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
