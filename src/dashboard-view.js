var cdb = require('cartodb.js');
var template = require('./dashboard.tpl');
var DashboardBelowMapView = require('./dashboard-below-map-view');
var DashboardMenuView = require('./dashboard-menu-view');
var DashboardSidebarView = require('./dashboard-sidebar-view');

/**
 * Dashboard is a wrapper around the map canvas, which contains widget views for the map contdxt
 * Widgets may be rendered in two areas, in the "sidebar" or "below-map".
 */
module.exports = cdb.core.View.extend({
  className: 'CDB-Dashboard-canvas',

  initialize: function (options) {
    this._widgets = options.widgets;
    this._infoView = options.infoView;

    // TODO parent context requires some markup to be present already, but NOT the other views
    this.el.classList.add(this.className);
    this.$el.html(template());
  },

  render: function () {
    this.clearSubViews();

    var view;
    var doRenderMenu = this.model.get('renderMenu');

    if (doRenderMenu) {
      view = new DashboardMenuView({
        model: this.model
      });
      this.addView(view);
      this.$el.append(view.render().el);
    }

    view = new DashboardBelowMapView({
      widgets: this._widgets
    });
    this.addView(view);
    this.$('.js-map-wrapper')
      .toggleClass('CDB-Dashboard-mapWrapper--withMenu', doRenderMenu)
      .append(view.render().el);

    view = new DashboardSidebarView({
      widgets: this._widgets,
      model: this.model
    });
    this.addView(view);
    this.$el.append(view.render().el);

    return this;
  },
  getInitialMapState: function () {
    return {
      center: this.model.get('initialPosition').center,
      zoom: this.model.get('initialPosition').zoom
    };
  }
});
