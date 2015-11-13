var Backbone = require('backbone');
var WidgetModel = require('../widget_model');
var _ = require('underscore');

module.exports = WidgetModel.extend({

  url: function() {
    var url = this.get('url') + '?bbox=' + this.get('boundingBox');
    if (_.isNumber(this.get('start'))) {
      url += '&start=' + this.get('start');
    }
    if (_.isNumber(this.get('end'))) {
      url += '&end=' + this.get('end');
    }
    if (_.isNumber(this.get('bins'))) {
      url += '&bins=' + this.get('bins');
    }
    return url;
  },

  initialize: function(attrs, opts) {
    this._offData = new Backbone.Collection(this.get('data'));
    this._onData = new Backbone.Collection(this.get('data'));

    WidgetModel.prototype.initialize.call(this, attrs, opts);
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
      type: 'time',
      options: {
        column: this.get('column'),
        bins: this.get('bins')
      }
    };
  }
});
