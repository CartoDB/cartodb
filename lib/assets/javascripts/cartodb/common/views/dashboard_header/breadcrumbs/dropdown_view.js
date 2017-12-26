var cdb = require('cartodb.js-v3');
cdb.admin = require('cdb.admin');
var $ = require('jquery-cdb-v3');
var navigateThroughRouter = require('../../../view_helpers/navigate_through_router');

/**
 * The content of the dropdown menu opened by the link at the end of the breadcrumbs menu, e.g.
 *   username > [Maps]
 *          ______/\____
 *         |            |
 *         |    this    |
 *         |____________|
 */
module.exports = cdb.admin.DropdownMenu.extend({
  className: 'Dropdown BreadcrumbsDropdown',

  events: {
    'click a':  '_navigateToLinksHref'
  },

  initialize: function() {
    this.elder('initialize');
    if (!this.options.viewModel) {
      throw new Error('viewModel must be provided');
    }
    this.viewModel = this.options.viewModel;
    // Optional
    this.router = this.options.router;
  },

  render: function() {
    var dashboardUrl = this.model.viewUrl().dashboard();
    var datasetsUrl = dashboardUrl.datasets();
    var deepInsightsUrl = dashboardUrl.deepInsights();
    var mapsUrl = dashboardUrl.maps();

    this.$el.html(this.template_base({
      avatarUrl: this.model.get('avatar_url'),
      userName: this.model.get('username'),
      mapsUrl: mapsUrl,
      datasetsUrl: datasetsUrl,
      deepInsightsUrl: deepInsightsUrl,
      lockedDatasetsUrl: datasetsUrl.lockedItems(),
      lockedMapsUrl: mapsUrl.lockedItems(),
      isDeepInsights: this.viewModel.isDisplayingDeepInsights(),
      isDatasets: this.viewModel.isDisplayingDatasets(),
      isMaps: this.viewModel.isDisplayingMaps(),
      isLocked: this.viewModel.isDisplayingLockedItems()
    }));

    // Necessary to hide dialog on click outside popup, for example.
    cdb.god.bind('closeDialogs', this.hide, this);

    // TODO: taken from existing code, how should dropdowns really be added to the DOM?
    $('body').append(this.el);

    return this;
  },

  _navigateToLinksHref: function() {
    this.hide(); //hide must be called before routing for proper deconstruct of dropdown
    if (this.options.router) {
      navigateThroughRouter.apply(this, arguments);
    }
  },

  clean: function() {
    // Until https://github.com/CartoDB/cartodb.js/issues/238 is resolved:
    $(this.options.target).unbind("click", this._handleClick);
    this.constructor.__super__.clean.apply(this);
  }
});
