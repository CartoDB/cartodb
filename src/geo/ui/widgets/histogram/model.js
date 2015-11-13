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
    if (_.isNumber(this.get('own_filter'))) {
      url += '&own_filter=' + this.get('own_filter');
    }
    return url;
  },

  initialize: function(attrs, opts) {
    this._data = new Backbone.Collection(this.get('data'));

    WidgetModel.prototype.initialize.call(this, attrs, opts);
  },

  _onChangeBinds: function() {
    this.bind('change:url change:start change:end', function(){
      if (this.get('sync')) {
        this._fetch();
      }
    }, this);
    this.bind('change:boundingBox', function() {
      if (this.get('bbox')) {
        this._fetch();
      }
    }, this);
  },

  getData: function() {
    return this._data.toJSON();
  },

  getSize: function() {
    return this._data.size();
  },

  parse: function(data) {

    this._data.reset(data.bins);

    return {
      data: data.bins,
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
