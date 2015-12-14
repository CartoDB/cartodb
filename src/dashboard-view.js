var View = cdb.core.View
var template = require('./dashboard.tpl')
var DashboardBelowMapView = require('./dashboard-below-map-view')
var DashboardInfoView = require('./dashboard-info-view')
var DashboardSidebarView = require('./dashboard-sidebar-view')

/**
 * Dashboard is a wrapper around the map canvas, which contains widget views for the map contdxt
 * Widgets may be rendered in two areas, in the "sidebar" or "below-map".
 */
module.exports = View.extend({
  className: 'CDB-Dashboard-canvas',

  initialize: function (options) {
    this._widgets = options.widgets
    this._dashboardInfoModel = options.dashboardInfoModel

    // TODO parent context requires some markup to be present already, but NOT the other views
    this.el.classList.add(this.className)
    this.$el.html(template())
  },

  render: function () {
    this.clearSubViews()

    var view
    view = new DashboardInfoView({
      model: this._dashboardInfoModel
    })
    this.addView(view)
    this.$el.append(view.render().el)

    view = new DashboardBelowMapView({
      widgets: this._widgets
    })
    this.addView(view)
    this.$('.js-map-wrapper').append(view.render().el)

    view = new DashboardSidebarView({
      widgets: this._widgets
    })
    this.addView(view)
    this.$el.append(view.render().el)

    return this
  }
})
