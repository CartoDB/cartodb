var $ = require('jquery');
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

    this._onWindowResize = this._onWindowResize.bind(this);
    $(window).bind('resize', this._onWindowResize);
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
      bounds: this.model.get('initialPosition').bounds
    };
  },

  _onWindowResize: function () {
    this._widgets.each(function (widget) {
      widget.forceResize();
    });
  },

  clean: function () {
    $(window).unbind('resize', this._onWindowResize);
    cdb.core.View.prototype.clean.call(this);
  }
});
