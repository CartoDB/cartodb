cdb.windshaft.filters.Collection = Backbone.Collection.extend({

  toJSON: function() {
    var json = {};
    var activeFilters = this.getActiveFilters();
    if (activeFilters.length) {
      json.layers = [];
      _.each(activeFilters, function(filter) {
        if (!filter.isEmpty()) {
          json.layers.push(filter.toJSON());
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