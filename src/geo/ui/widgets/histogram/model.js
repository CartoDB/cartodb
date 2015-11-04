cdb.geo.ui.Widget.HistogramModel = cdb.geo.ui.Widget.Model.extend({

  initialize: function(attrs, opts) {
    this._data = new Backbone.Collection(this.get('data'));
    cdb.geo.ui.Widget.Model.prototype.initialize.call(this, attrs, opts);
  },

  getData: function() {
    return this._data;
  },

  getSize: function() {
    return this._data.size();
  },

  parse: function(data) {
    var bins = data.ownFilterOff.bins;
    this._data.reset(bins);
    return {
      data: bins,
      width: data.width
    };
  },

  toJSON: function(d) {
    return {
      type: "histogram",
      options: {
        column: this.get('column'),
        bins: this.get('bins')
      }
    };
  }

});
