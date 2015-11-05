var Backbone = require('backbone');
var WidgetModel = require('../widget_model');

module.exports = WidgetModel.extend({

  initialize: function() {
    this._data = new Backbone.Collection(this.get('data'));
    WidgetModel.prototype.initialize.call(this);
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
