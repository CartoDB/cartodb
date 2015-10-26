var _ = require('underscore');
var jQueryProxy = require('jquery-proxy');
var View = require('../../../core/view');

var StackedLegend = View.extend({

  events: {
    "dragstart":            "_stopPropagation",
    "mousedown":            "_stopPropagation",
    "touchstart":           "_stopPropagation",
    "MSPointerDown":        "_stopPropagation",
    "dblclick":             "_stopPropagation",
    "mousewheel":           "_stopPropagation",
    "DOMMouseScroll":       "_stopPropagation",
    "dbclick":              "_stopPropagation",
    "click":                "_stopPropagation"
  },

  className: "cartodb-legend-stack",

  initialize: function() {
    _.each(this.options.legends, this._setupBinding, this);
  },

  _stopPropagation: function(ev) {
    ev.stopPropagation();
  },

  getLegendByIndex: function(index) {
    if (!this._layerByIndex) {
      this._layerByIndex = {};
      var legends = this.options.legends;
      for (var i = 0; i < legends.length; ++i) {
        var legend = legends[i];
        this._layerByIndex[legend.options.index] = legend;
      }
    }
    return this._layerByIndex[index];
  },

  _setupBinding: function(legend) {
    legend.model.bind("change:type", this._checkVisibility, this);
    this.add_related_model(legend.model);
  },

  render: function() {
    this._renderItems();
    this._checkVisibility();

    return this;
  },

  _renderItems: function() {
    _.each(this.options.legends, function(item) {
      this.$el.append(item.render().$el);
    }, this);
  },

  _checkVisibility: function() {
    var visible = _.some(this.options.legends, function(legend) {
      return legend.model.get("type") && (legend.model.get("type") != "none"  || legend.model.get("template"))
    }, this);

    if (visible) {
      this.show();
    } else {
      this.hide();
    }

    _.each(this.options.legends, function(item) {
      var legendModel = item.model;
      if (legendModel.get("type") === "none" || legendModel.get("visible") === false) {
        item.hide();
      } else {
        item.show();
      }
    }, this);
  },

  show: function() {
    this.$el.show();
  },

  hide: function() {
    this.$el.hide();
  },

  addTo: function(element) {
    var $ = jQueryProxy.get();
    $(element).html(this.render().$el);
  }
});

module.exports = StackedLegend;
