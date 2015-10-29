cdb.windshaft.filters.BoundingBoxFilter = cdb.core.Model.extend({

  initialize: function(bounds) {
    this.setBounds(bounds);
  },

  setBounds: function(bounds) {
    this.set({
      westLatitude: bounds[0][0],
      southLatitude: bounds[0][1],
      northLatitude: bounds[1][0],
      eastLatitude: bounds[1][1]
    });
  },

  toString: function() {
    return [
      this.get('westLatitude'),
      this.get('southLatitude'),
      this.get('eastLatitude'),
      this.get('northLatitud')
    ].join(',');
  }
});