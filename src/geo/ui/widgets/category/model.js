cdb.geo.ui.Widget.CategoryModel = cdb.geo.ui.Widget.Model.extend({

  defaults: {
    data: [],
    columns: []
  },

  initialize: function() {
    this.filter = new cdb.windshaft.filters.CategoryFilter();
    this._data = new Backbone.Collection(this.get('data'));
    cdb.geo.ui.Widget.Model.prototype.initialize.call(this);
  },

  getData: function() {
    return this._data;
  },

  getTotalCount: function() {
    return this._data.reduce(function(memo, datum) {
      return memo + datum.get('count');
    }, 0);
  },

  getSize: function() {
    return this._data.size();
  },

  getDataSerialized: function() {
    return this.get('data');
  },

  parse: function(r) {
    console.log(r);
    this._data.reset(r);
    return {
      data: r
    };
  }
});
