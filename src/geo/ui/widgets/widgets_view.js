var View = require('cdb/core/view');
var _ = require('underscore');
var $ = require('jquery');
var LayerWidgetsView = require('cdb/geo/ui/widgets/layer_widgets_view');
var Ps = require('perfect-scrollbar');

module.exports = View.extend({

  className: 'Widget-canvas',

  initialize: function(options) {
    this.layers = options.layers;
  },

  render: function() {
    this._cleanScrollEvent();
    this.clearSubViews();
    this.$el.empty();
    this.$el.append($('<div>').addClass('Widget-canvasInner'));
    this.layers.each(this._renderLayerWidgetsView, this);
    this._renderScroll();
    this._renderShadows();
    this._bindScroll();
    return this;
  },

  _renderLayerWidgetsView: function(layer) {
    var layerWidgetsView = new LayerWidgetsView({
      widgetViewFactory: this.options.widgetViewFactory,
      model: layer
    });
    var widgets = layer.getWidgets();
    widgets.bind('change:collapsed', this._onWidgetCollapsed, this);
    this.$('.Widget-canvasInner').append(layerWidgetsView.render().el);
    this.addView(layerWidgetsView);
  },

  _bindScroll: function() {
    this.$('.Widget-canvasInner')
      .on('ps-y-reach-start', _.bind(this._onScrollTop, this))
      .on('ps-y-reach-end', _.bind(this._onScrollBottom, this))
      .on('ps-scroll-y', _.bind(this._onScroll, this));
  },

  _renderScroll: function() {
    Ps.initialize(this.$('.Widget-canvasInner').get(0), {
      wheelSpeed: 2,
      wheelPropagation: true,
      minScrollbarLength: 20
    });
  },

  _onWidgetCollapsed: function() {
    Ps.update(this.$('.Widget-canvasInner').get(0));
  },

  _renderShadows: function() {
    var self = this;
    this.$shadowTop = $('<div>').addClass("Widget-canvasShadow Widget-canvasShadow--top");
    this.$shadowBottom = $('<div>').addClass("Widget-canvasShadow Widget-canvasShadow--bottom is-visible");
    this.$el.append(this.$shadowTop);
    this.$el.append(this.$shadowBottom);
  },

  _onScrollTop: function() {
    this.$shadowTop.removeClass('is-visible');
  },

  _onScroll: function() {
    var $el = this.$('.Widget-canvasInner');
    var currentPos = $el.scrollTop();
    var max = $el.get(0).scrollHeight;
    var height = $el.outerHeight();
    var maxPos = max - height;
    this.$shadowTop.toggleClass('is-visible', currentPos > 0);
    this.$shadowBottom.toggleClass('is-visible', currentPos < maxPos);
  },

  _onScrollBottom: function() {
    this.$shadowBottom.removeClass('is-visible');
  },

  _cleanScrollEvent: function() {
    this.$('.Widget-canvasInner').off('ps-scroll-y');
  },

  clean: function() {
    this._cleanScrollEvent();
    View.prototype.clean.call(this);
  }

});
