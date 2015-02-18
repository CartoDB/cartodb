var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var $ = require('jquery');
var navigateThroughRouter = require('new_common/view_helpers/navigate_through_router');

/**
 * The content of the dropdown menu opened by the link at the end of the breadcrumbs menu, e.g.
 *   username > [Maps]
 *          ______/\____
 *         |            |
 *         |    this    |
 *         |____________|
 */
module.exports = cdb.admin.DropdownMenu.extend({

  className: 'dropdown BreadcrumbsDropdown',

  events: {
    'click a':  '_navigateToLinksHref'
  },

  initialize: function() {
    this.elder('initialize');
    if (!this.options.viewModel) {
      throw new Error('viewModel must be provided');
    }
    if (!this.options.currentUserUrl) {
      throw new Error('currentUserUrl must be provided');
    }

    // Optional
    this.router = this.options.router;
  },

  render: function() {
    var datasetsUrl = this.options.currentUserUrl.datasetsUrl();
    var mapsUrl = this.options.currentUserUrl.mapsUrl();

    this.$el.html(this.template_base({
      avatarUrl:         this.model.get('avatar_url'),
      userName:          this.model.get('username'),
      mapsUrl:           mapsUrl.toDefault(),
      datasetsUrl:       datasetsUrl.toDefault(),
      lockedDatasetsUrl: datasetsUrl.toLocked(),
      lockedMapsUrl:     mapsUrl.toLocked(),
      isDatasets:        this.options.viewModel.isDisplayingDatasets(),
      isMaps:            this.options.viewModel.isDisplayingMaps(),
      isLocked:          this.options.viewModel.isDisplayingLockedItems()
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
