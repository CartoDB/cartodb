cdb.geo.ui.Widget.HistogramModel = cdb.geo.ui.Widget.Model.extend({

  initialize: function() {
    this._data = new Backbone.Collection(this.get('data'));
    cdb.geo.ui.Widget.Model.prototype.initialize.call(this);
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
      data: r
    };
  }

});
