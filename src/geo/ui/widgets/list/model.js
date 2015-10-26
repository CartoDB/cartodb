cdb.geo.ui.Widget.ListModel = cdb.geo.ui.Widget.Model.extend({

  options: {
    page: 0,
    per_page: 100
  },

  url: function() {
    return this.get('dashboardBaseURL') + '/list/' + this.get('id');
  },

  initialize: function() {
    this._data = new Backbone.Collection(this.get('data'));
    this._initBinds();
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

  parse: function(r) {
    this._data.reset(r);
    return {
      data: r.data
    };
  }
});
