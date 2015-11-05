cdb.geo.ui.Widget.HistogramModel = cdb.geo.ui.Widget.Model.extend({

  initialize: function() {
    this._offData = new Backbone.Collection(this.get('data'));
    this._onData = new Backbone.Collection(this.get('data'));

    cdb.geo.ui.Widget.Model.prototype.initialize.call(this);
  },

  getData: function() {
    return { off: this._offData, on: this._onData };
  },

  getDataWithOwnFilterApplied: function() {
    return this._onData.toJSON();
  },

  getDataWithoutOwnFilterApplied: function() {
    return this._offData.toJSON();
  },

  getSize: function() {
    return { off: this._offData.size(), on: this._onData.size() };
  },

  parse: function(data) {
    var offBins = data.ownFilterOff.bins;
    var onBins = data.ownFilterOn.bins;

    this._offData.reset(offBins);
    this._onData.reset(onBins);

    return {
      off: offBins,
      on: onBins,
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
