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

  parse: function(data) {
    var bins = data.bins;
    this._data.reset(bins);
    return {
      data: bins
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
