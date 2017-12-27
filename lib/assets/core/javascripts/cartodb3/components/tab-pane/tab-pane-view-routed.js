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
    var currentRoute = Router.getCurrentRoute();
    var routeName = _.last(currentRoute.split('/'));
    var tabName = model.get('name');

    if (this._initialRoute) {
      var parsed = selectedView.handleRoute && selectedView.handleRoute(this._initialRoute);

      if (parsed === false) {
        Router.replaceWithRoot();
      }

      if (this.collection.isDisabledTab(routeName) && tabName !== routeName) {
        var newRoute = currentRoute.replace(routeName, tabName);
        Router.replaceState(newRoute);
      }

      this._initialRoute = null;
    } else {
      selectedView.handleRoute && selectedView.handleRoute(Router.getRouteModel().get('currentRoute'));
    }

    return selectedView;
  }
});
