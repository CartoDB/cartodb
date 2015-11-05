var _ = require('underscore');
var Backbone = require('backbone');

module.exports = Backbone.Collection.extend({

  toJSON: function() {
    var json = {};
    var activeFilters = this.getActiveFilters();
    if (activeFilters.length) {
      json.layers = [];
      _.each(activeFilters, function(filter) {
        if (!filter.isEmpty()) {
          var index = filter.get('layerIndex');
          if (json.layers[index]) {
            _.extend(json.layers[index],filter.toJSON());
          } else {
            json.layers[index] = filter.toJSON();
          }
        }
      });
    }

    return json;
  },

  getActiveFilters: function() {
    return this.filter(function(filter) {
      return !filter.isEmpty();
    });
  }
});
