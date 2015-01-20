var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var $ = require('jquery');
var handleAHref = require('new_common/view_helpers/handle_a_href_on_click');

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
    'click a':  '_navigateToLinksHref',
    'click':    'killEvent'
  },

  initialize: function(args) {
    this.constructor.__super__.initialize.apply(this);

    this.router = args.router;
    this.add_related_model(this.router);
  },

  render: function() {
    var rm = this.router.model;
    var datasetsUrl = this.router.currentUserUrl.datasetsUrl();
    var mapsUrl = this.router.currentUserUrl.mapsUrl();

    this.$el.html(this.template_base({
      avatarUrl:         this.model.get('avatar_url'),
      userName:          this.model.get('username'),
      mapsUrl:           mapsUrl.toDefault(),
      datasetsUrl:       datasetsUrl.toDefault(),
      lockedDatasetsUrl: datasetsUrl.toLocked(),
      lockedMapsUrl:     mapsUrl.toLocked(),
      isDatasets:        rm.get('content_type') === 'datasets',
      isLocked:          !!rm.get('locked')
    }));

    // Necessary to hide dialog on click outside popup, for example.
    cdb.god.bind('closeDialogs', this.hide, this);

    // TODO: taken from existing code, how should dropdowns really be added to the DOM?
    $('body').append(this.el);

    return this;
  },

  _navigateToLinksHref: function() {
    this.hide(); //hide must be called before routing for proper deconstruct of dropdown
    handleAHref.apply(this, arguments);
  },

  clean: function() {
    // Until https://github.com/CartoDB/cartodb.js/issues/238 is resolved:
    $(this.options.target).unbind("click", this._handleClick);
    this.constructor.__super__.clean.apply(this);
  }
});
