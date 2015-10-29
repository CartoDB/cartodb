cdb.windshaft.filters.BoundingBoxFilter = cdb.core.Model.extend({

  initialize: function(bounds) {
    this.setBounds(bounds);
  },

  setBounds: function(bounds) {
    this.set({
      west: bounds[0][0],
      south: bounds[0][1],
      north: bounds[1][0],
      east: bounds[1][1]
    });
  },

  toString: function() {
    return [
      this.get('south'),
      this.get('west'),
      this.get('east'),
      this.get('north')
    ].join(',');
  }
});
