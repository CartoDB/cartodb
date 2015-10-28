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

  getMaxCount: function() {
    return this._data.max(function(datum) {
      return datum.get('count');
    }).get('count');
  },

  getSize: function() {
    return this._data.size();
  },

  getDataSerialized: function() {
    return this.get('data');
  },

  fetch: function(opts) {
    this.trigger("loading", this);
    return cdb.core.Model.prototype.fetch.call(this,opts);
  },

  parse: function(r) {
    this._data.reset(r);
    return {
      data: r.data
    };
  }
});
