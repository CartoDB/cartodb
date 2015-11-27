var View = require('cdb/core/view');
var _ = require('underscore');
var $ = require('jquery');
var LayerWidgetsView = require('cdb/geo/ui/widgets/layer_widgets_view');
require('simplebar');

module.exports = View.extend({

  className: 'Widget-canvas',
  attributes: {
    "data-simplebar-direction": "vertical"
  },

  initialize: function(options) {
    this.layers = options.layers;
  },

  render: function() {
    this._cleanScrollEvent();
    this.clearSubViews();
    this.layers.each(this._renderLayerWidgetsView, this);
    this._renderScroll();
    this._renderShadows();
    return this;
  },

  _renderLayerWidgetsView: function(layer) {
    var layerWidgetsView = new LayerWidgetsView({
      widgetViewFactory: this.options.widgetViewFactory,
      model: layer
    });
    this.$el.append(layerWidgetsView.render().el);
    this.addView(layerWidgetsView);
  },

  _renderScroll: function() {
    this.$el.simplebar().on('scroll', _.bind(this._checkShadows, this));
  },

  _renderShadows: function() {
    var self = this;
    this.$shadowTop = $('<div>').addClass("Widget-canvasShadow Widget-canvasShadow--top");
    this.$shadowBottom = $('<div>').addClass("Widget-canvasShadow Widget-canvasShadow--bottom is-visible");
    this.$el.append(this.$shadowTop);
    this.$el.append(this.$shadowBottom);
    setTimeout(function() {
      self._checkShadows();
    },0);
  },

  _checkShadows: function() {
    var currentPos = this.$el.simplebar('getScrollElement').scrollTop();
    var max = this.$el.simplebar('getContentElement').get(0).scrollHeight;
    var height = this.$el.simplebar('getScrollElement').outerHeight();
    var maxPos = max - height;
    this.$shadowTop.toggleClass('is-visible', currentPos > 0);
    this.$shadowBottom.toggleClass('is-visible', currentPos < maxPos);
  },

  _cleanScrollEvent: function() {
    this.$el.off('scroll');
  },

  clean: function() {
    this._cleanScrollEvent();
    View.prototype.clean.call(this);
  }

});
