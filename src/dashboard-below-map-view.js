var _ = require('underscore')
var cdb = require('cartodb.js')
var WidgetViewFactory = require('./widgets/widget-view-factory')
var TimeSeriesContentView = require('./widgets/time-series/content-view')
var TorqueTimeSeriesContentView = require('./widgets/time-series/torque-content-view')

module.exports = cdb.core.View.extend({
  className: 'CDB-Dashboard-belowMap',

  initialize: function (options) {
    this._widgetViewFactory = new WidgetViewFactory([
      {
        match: function (m) {
          // isForTimeSeries is set to true to distinguish from default type 'histogram'
          // This match needs to be done before the default time-series widget's match below to have presedence
          return m.isForTimeSeries && m.layer.get('type') === 'torque'
        },
        createContentView: function (m) {
          return new TorqueTimeSeriesContentView({
            model: m,
            rangeFilter: m.filter,
            torqueLayerModel: m.layer
          })
        },
        customizeWidgetAttrs: function (attrs) {
          attrs.className += ' CDB-Widget--timeSeries'
          return attrs
        }
      }, {
        match: function (m) {
          // isForTimeSeries is set to true to distinguish from default type 'histogram'
          return m.isForTimeSeries
        },
        createContentView: function (m) {
          return new TimeSeriesContentView({
            model: m,
            filter: m.filter
          })
        },
        customizeWidgetAttrs: function (attrs) {
          attrs.className += ' CDB-Widget--timeSeries'
          return attrs
        }
      }
    ])

    this._widgets = options.widgets
    this._widgets.bind('add', this._maybeRenderWidgetView, this)
    this._widgets.bind('reset', this.render, this)
    this.add_related_model(this._widgets)
  },

  render: function () {
    this.clearSubViews()
    this.$el.empty()
    this._widgets.each(this._maybeRenderWidgetView, this)
    this.$el.toggle(!_.isEmpty(this._subviews))
    return this
  },

  _maybeRenderWidgetView: function (widgetModel) {
    var view = this._widgetViewFactory.createWidgetView(widgetModel)
    if (view) {
      this.addView(view)
      this.$el.append(view.render().el)
    }
  }

})
