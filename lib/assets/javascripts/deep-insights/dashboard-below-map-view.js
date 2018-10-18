var _ = require('underscore');
var CoreView = require('backbone/core-view');
var WidgetViewFactory = require('./widgets/widget-view-factory');
var TimeSeriesContentView = require('./widgets/time-series/content-view');
var TorqueTimeSeriesContentView = require('./widgets/time-series/torque-content-view');

var TIME_SERIES_TYPE = 'time-series';

module.exports = CoreView.extend({
  className: 'CDB-Dashboard-belowMap',

  initialize: function (options) {
    this._widgetViewFactory = new WidgetViewFactory([
      {
        // same type as below, but also check if the associated layer is a a torque layer
        match: function (widgetModel) {
          if (widgetModel.get('type') === TIME_SERIES_TYPE) {
            var dataviewModel = widgetModel.dataviewModel;
            var layerModel = widgetModel.layerModel;
            return dataviewModel && layerModel.get('type') === 'torque' && widgetModel.get('animated') === true;
          }
          return false;
        },
        createContentView: function (widgetModel) {
          return new TorqueTimeSeriesContentView({
            model: widgetModel
          });
        },
        customizeWidgetAttrs: function (attrs) {
          attrs.className += ' CDB-Widget--timeSeries';
          return attrs;
        }
      }, {
        type: TIME_SERIES_TYPE,
        createContentView: function (widgetModel) {
          return new TimeSeriesContentView({
            model: widgetModel
          });
        },
        customizeWidgetAttrs: function (attrs) {
          attrs.className += ' CDB-Widget--timeSeries';
          return attrs;
        }
      }
    ]);

    this._widgets = options.widgets;
    this._widgets.bind('add', this._maybeRenderWidgetView, this);
    this._widgets.bind('reset', this.render, this);
    this._widgets.bind('add reset remove', this._onWidgetsChange, this);
    this.add_related_model(this._widgets);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this._widgets.each(this._maybeRenderWidgetView, this);
    this._toggleVisiblity();

    return this;
  },

  _maybeRenderWidgetView: function (widgetModel) {
    var view = this._widgetViewFactory.createWidgetView(widgetModel);
    if (view) {
      this.addView(view);
      this.$el.append(view.render().el);
    }
  },

  _toggleVisiblity: function () {
    this.$el.toggle(!_.isEmpty(this._subviews));
  },

  _onWidgetsChange: function () {
    this._widgets.each(function (widget) {
      widget.forceResize();
    });
    this._toggleVisiblity();
  }
});
