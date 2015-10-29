cdb.windshaft.filters.BoundingBoxFilter = cdb.core.Model.extend({

  initialize: function(bounds) {
    this.setBounds(bounds);
  },

  setBounds: function(bounds) {
    this.southLatitude = bounds[0][1];
    this.westLatitude = bounds[0][0];
    this.eastLatitude = bounds[1][1];
    this.northLatitude = bounds[1][0];
  },

  toString: function() {
    return [
      this.westLatitude,
      this.southLatitude,
      this.eastLatitude,
      this.northLatitude
    ].join(',');
  }
});