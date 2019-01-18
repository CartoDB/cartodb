var cdb = require('cartodb.js-v3');
var PaginationModel = require('../../common/views/pagination/model');
var PaginationView = require('../../common/views/pagination/view');
var pluralizeString = require('../../common/view_helpers/pluralize_string');
var navigateThroughRouter = require('../../common/view_helpers/navigate_through_router');

var filterShortcutId = 'filter-shortcut';
var events = {};
events['click #' + filterShortcutId + ' a'] = navigateThroughRouter;

/**
 * Responsible for the content footer of the layout.
 *  ___________________________________________________________________________
 * |                                                                           |
 * | [show your locked datasets/maps]           Page 2 of 42 [1] 2 [3][4][5]  |
 * |___________________________________________________________________________|
 *
 */
module.exports = cdb.core.View.extend({

  events: events,

  initialize: function(args) {
    if (!args.el) throw new Error('The root element must be provided from parent view');

    this.collection = args.collection;
    this.router = args.router;
    this.router.model.bind('change', this.render, this);
    this.add_related_model(this.router.model);

    this._createPaginationView(this.collection, this.router);
    this._setupFilterShortcut(this.collection, this.router);
  },

  render: function() {
    this.clearSubViews();

    this._renderFilterShortcut();
    this._renderPaginationView();

    return this;
  },

  _createPaginationView: function(collection, router) {
    var model = new PaginationModel({
      current_page: router.model.get('page'),
      url_to: function(page) { return router.currentUrl({ page: page }) }
    });

    // Some properties (e.g. total_entries) cannot be observed, so listen to all changes and update model accordingly
    collection.bind('all', _.partial(this._updatePaginationModelByCollection, model, collection));
    router.model.bind('change', _.partial(this._updatePaginationModelByRouter, model, router.model));

    this.paginationView = new PaginationView({
      model:  model,
      router: this.router
    });
    this.addView(this.paginationView);
  },

  _updatePaginationModelByCollection: function(model, collection) {
    model.set({
      per_page:    collection.options.get('per_page'),
      total_count: collection.total_entries
    });
  },

  _updatePaginationModelByRouter: function(model, routerModel) {
    model.set('current_page', routerModel.get('page'));
  },

  _renderFilterShortcut: function() {
    // Create DOM placeholder for first render..
    this.$el.append('<div id="' + filterShortcutId + '"></div>');

    // ..for subsequent render simply replace the placeholder's content (by overriding this fn to):
    this._renderFilterShortcut = function() {
      var html = '';

      var rModel = this.router.model;
      var currentUrl = this.router.currentDashboardUrl();
      var totalCount = this.filterShortcutVis.total_entries;
      var d = {
        totalCount:         totalCount,
        pluralizedContents: this._pluralizedContentType(totalCount),
        url:                rModel.get('locked') ? currentUrl : currentUrl.lockedItems()
      };

      if (rModel.get('locked')) {
        html = this.filterShortcutNonLockedTemplate(d);
      } else if (totalCount > 0 && this._isLockInfoNeeded()) {
        html = this.filterShortcutLockedTemplate(d);
      }

      this.$('#'+ filterShortcutId).html(html);
    }
  },

  _pluralizedContentType: function(totalCount) {
    var contentTypeWithoutTrailingS = this.router.model.get('content_type').slice(0, -1);
    return pluralizeString(contentTypeWithoutTrailingS, totalCount);
  },

  _setupFilterShortcut: function(collection, router) {
    this.filterShortcutLockedTemplate =    cdb.templates.getTemplate('dashboard/content_footer/filter_shortcut/locked_template');
    this.filterShortcutNonLockedTemplate = cdb.templates.getTemplate('dashboard/content_footer/filter_shortcut/non_locked_template');
    this.filterShortcutVis = new cdb.admin.Visualizations();
    collection.bind('loaded', this._updateFilterShortcut, this);
    this.add_related_model(collection);
  },

  _isLockInfoNeeded: function() {
    return this.router.model.get('shared') === 'no' &&
      !this.router.model.get('library') &&
      !this.router.model.isSearching();
  },

  _updateFilterShortcut: function() {
    if (this._isLockInfoNeeded()) {
      this.filterShortcutVis.options.set({
        locked:         !this.router.model.get('locked'),
        shared:         'no',
        page:           1,
        per_page:       1,
        only_liked:     this.router.model.get('liked'),
        q:              this.router.model.get('q'),
        tag:            this.router.model.get('tags'),
        type:           this.router.model.get('content_type') === 'datasets' ? 'table' : 'derived'
      });

      var self = this;
      this.filterShortcutVis.fetch({
        success: function(c) {
          self.render();
        }
      });
    } else {
      this.render();
    }
  },

  _renderPaginationView: function() {
    this.paginationView.render();
    this.$el.append(this.paginationView.el);
  }
});
