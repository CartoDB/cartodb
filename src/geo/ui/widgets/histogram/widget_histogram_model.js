cdb.geo.ui.Widget.HistogramModel = cdb.geo.ui.Widget.Model.extend({

  options: {
    page: 0,
    per_page: 100
  },

  defaults: {
    data: [],
    columns: []
  },

  initialize: function() {
    this._data = new Backbone.Collection(this.get('data'));
    cdb.geo.ui.Widget.Model.prototype.initialize.call(this);
  },

  _createUrlOptions: function() {
    return _.compact(_(this.options).map(
      function(v, k) {
        return k + "=" + encodeURIComponent(v);
      }
    )).join('&');
  },

  getData: function() {
    return this._data;
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
