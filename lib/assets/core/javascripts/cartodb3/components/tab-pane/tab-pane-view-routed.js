var _ = require('underscore');
var TabPaneView = require('./tab-pane-view.js');
var TabPaneViewItemRouted = require('./tab-pane-item-view-routed.js');
var Router = require('../../routes/router');

module.exports = TabPaneView.extend({
  initialize: function (options) {
    TabPaneView.prototype.initialize.call(this, options);

    this.onRouteChange = options.onRouteChange;
    this.onRouteChange && this.listenTo(Router.getRouteModel(), 'change:currentRoute', this.onRouteChange);
    this.onRouteChange && this._initialRoute(Router.getRouteModel());
  },

  _renderTabPaneItemView: function (model) {
    var tabPaneItemView = new TabPaneViewItemRouted(_.extend({ model: model }, this._tabPaneItemOptions));
    this.addView(tabPaneItemView);
    this.$('.js-menu').append(tabPaneItemView.render().el);
  },

  _initialRoute: function (routeModel) {
    this._initialRoute = routeModel.get('currentRoute');
    this.onRouteChange(routeModel);
  },

  _renderTabPaneContentView: function (model) {
    var selectedView = TabPaneView.prototype._renderTabPaneContentView.call(this, model);

    if (this._initialRoute) {
      selectedView.handleRoute && selectedView.handleRoute(this._initialRoute);
      this._initialRoute = null;
    }

    return selectedView;
  }
});
