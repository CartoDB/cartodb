const $ = require('jquery');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const navigateThroughRouter = require('builder/helpers/navigate-through-router');
const AdminDropdownMenu = require('dashboard/components/dropdown/dropdown-admin-view');

const REQUIRED_OPTS = [
  'viewModel'
];

/**
 * The content of the dropdown menu opened by the link at the end of the breadcrumbs menu, e.g.
 *   username > [Maps]
 *          ______/\____
 *         |            |
 *         |    this    |
 *         |____________|
 */

module.exports = AdminDropdownMenu.extend({
  className: 'Dropdown BreadcrumbsDropdown',

  events: {
    'click a': '_navigateToLinksHref'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    AdminDropdownMenu.prototype.initialize.apply(this, arguments);
  },

  render: function () {
    var dashboardUrl = this.model.viewUrl().dashboard();
    var datasetsUrl = dashboardUrl.datasets();
    var deepInsightsUrl = dashboardUrl.deepInsights();
    var mapsUrl = dashboardUrl.maps();

    this.$el.html(this.template({
      avatarUrl: this.model.get('avatar_url'),
      userName: this.model.get('username'),
      mapsUrl: mapsUrl,
      datasetsUrl: datasetsUrl,
      deepInsightsUrl: deepInsightsUrl,
      lockedDatasetsUrl: datasetsUrl.lockedItems(),
      lockedMapsUrl: mapsUrl.lockedItems(),
      isDeepInsights: this._viewModel.isDisplayingDeepInsights(),
      isDatasets: this._viewModel.isDisplayingDatasets(),
      isMaps: this._viewModel.isDisplayingMaps(),
      isLocked: this._viewModel.isDisplayingLockedItems()
    }));

    // Necessary to hide dialog on click outside popup, for example.
    // TODO: Handle this
    // cdb.god.bind('closeDialogs', this.hide, this);

    // TODO: taken from existing code, how should dropdowns really be added to the DOM?
    $('body').append(this.el);

    return this;
  },

  _navigateToLinksHref: function () {
    this.hide(); // Hide must be called before routing for proper deconstruct of dropdown

    if (this.options.router) {
      navigateThroughRouter.apply(this, arguments);
    }
  }
});
