var _ = require('underscore');
var $ = require('jquery');
var Ps = require('perfect-scrollbar');
var cdb = require('cartodb.js');
var CategoryContentView = require('./widgets/category/content-view');
var FormulaContentView = require('./widgets/formula/content-view');
var HistogramContentView = require('./widgets/histogram/content-view');
var WidgetViewFactory = require('./widgets/widget-view-factory');
var template = require('./dashboard-sidebar.tpl');
var matchMedia = window.matchMedia;

module.exports = cdb.core.View.extend({
  className: 'CDB-Widget-canvas',

  initialize: function (options) {
    this._widgetViewFactory = new WidgetViewFactory([
      {
        type: 'formula',
        createContentView: function (widgetModel) {
          return new FormulaContentView({
            model: widgetModel
          });
        }
      }, {
        type: 'histogram',
        createContentView: function (widgetModel) {
          return new HistogramContentView({
            model: widgetModel
          });
        }
      }, {
        type: 'category',
        createContentView: function (widgetModel) {
          return new CategoryContentView({
            model: widgetModel
          });
        }
      }
    ]);

    this._widgets = options.widgets;

    this._widgets.bind('add', this._maybeRenderWidgetView, this);
    this._widgets.bind('reset', this.render, this);
    this._widgets.bind('orderChanged', this.render, this);
    this._widgets.bind('change:collapsed', this._onWidgetUpdate, this);
    this._widgets.bind('add remove reset', this._onWidgetsChange, this); // have to be called _after_ any other add/remove/reset
    this.add_related_model(this._widgets);

    this._resizeHandler = this._onResize.bind(this);
  },

  render: function () {
    this._cleanScroll();
    this._observer && this._observer.disconnect();
    this.clearSubViews();

    this.$el.html(template());
    this.$el.toggleClass('CDB-Widget-canvas--withMenu', this.model.get('renderMenu'));
    this._widgets.each(this._maybeRenderWidgetView, this);
    this._toggleVisiblity();

    this._renderScroll();
    this._renderShadows();
    this._bindScroll();
    this._initResize();

    return this;
  },

  _initResize: function () {
    var breakpoints = ['(max-width: 1600px)', '(max-width: 1280px)', '(max-width: 759px)'];
    breakpoints.forEach(function (breakpoint) {
      var mq = matchMedia(breakpoint);
      mq.addListener(this._resizeHandler);
    }, this);
  },

  _updateScrollCss: function () {
    this._onWidgetUpdate();

    var element = this._container();
    if (!element) return;

    var containerWidth = element.clientWidth;
    var containerHeight = element.clientHeight;
    var contentWidth = element.scrollWidth;
    var contentHeight = element.scrollHeight;
    var xScroll = containerWidth < contentWidth;
    var yScroll = containerHeight < contentHeight;

    this._$container().toggleClass('hasXScroll', xScroll);
    this._$container().toggleClass('hasYScroll', yScroll);
  },

  _$container: function () {
    return $(this._container());
  },

  _container: function () {
    return this.el.querySelector('.js-container');
  },

  _maybeRenderWidgetView: function (widgetModel) {
    var view = this._widgetViewFactory.createWidgetView(widgetModel);
    if (view) {
      this.addView(view);
      this._$container().append(view.render().el);
    }
  },

  _bindScroll: function () {
    this._$container()
      .on('ps-y-reach-start', _.bind(this._onScrollTop, this))
      .on('ps-y-reach-end', _.bind(this._onScrollBottom, this))
      .on('ps-scroll-y', _.bind(this._onScroll, this));
  },

  _renderScroll: function () {
    Ps.initialize(this._container(), {
      wheelSpeed: 1,
      wheelPropagation: false,
      swipePropagation: true,
      stopPropagationOnClick: false,
      minScrollbarLength: 20
    });
  },

  _onWidgetUpdate: function () {
    Ps.update(this._container());
  },

  _renderShadows: function () {
    this.$shadowTop = $('<div>').addClass('CDB-Widget-canvasShadow CDB-Widget-canvasShadow--top');
    this.$shadowBottom = $('<div>').addClass('CDB-Widget-canvasShadow CDB-Widget-canvasShadow--bottom');
    this.$el.append(this.$shadowTop);
    this.$el.append(this.$shadowBottom);
  },

  _onScrollTop: function () {
    this.$shadowTop.removeClass('is-visible');
  },

  _onScroll: function () {
    var $el = this._$container();
    var currentPos = $el.scrollTop();
    var max = $el.get(0).scrollHeight;
    var height = $el.outerHeight();
    var maxPos = max - height;

    this.$shadowTop.toggleClass('is-visible', currentPos > 0);
    this.$shadowBottom.toggleClass('is-visible', currentPos < maxPos);
  },

  _updateScroll: function () {
    this._$container().scrollLeft = 0;
    this._$container().scrollTop = 0;
  },

  _onResize: function (mediaQuery) {
    // we don't use mediaQuery.matches
    // trigger actions always if breakpoints changes
    this._updateScroll();
    this._onScroll();
  },

  _onScrollBottom: function () {
    this.$shadowBottom.removeClass('is-visible');
  },

  _cleanScroll: function () {
    $(window).off('resize', this._resizeHandler);
    if (this._container()) {
      this._$container().off('ps-scroll-y');
      Ps.destroy(this._container());
    }
  },

  _toggleVisiblity: function () {
    this.$el.toggle(!_.isEmpty(this._subviews));
  },

  _onWidgetsChange: function () {
    this._toggleVisiblity();
  },

  clean: function () {
    this._cleanScroll();
    this._observer && this._observer.disconnect();
    cdb.core.View.prototype.clean.call(this);
  }

});
