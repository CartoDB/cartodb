const _ = require('underscore');
const CoreView = require('backbone/core-view');
const PaginationModel = require('builder/components/pagination/pagination-model');
const PaginationView = require('builder/components/pagination/pagination-view');
const pluralizeString = require('dashboard/helpers/pluralize');
const VisualizationsCollection = require('dashboard/data/visualizations-collection');
const filterShortcutLockedTemplate = require('./locked-template.tpl');
const filterShortcutNonLockedTemplate = require('./non-locked-template.tpl');
const navigateThroughRouter = require('builder/helpers/navigate-through-router');

const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

const filterShortcutId = 'filter-shortcut';
/**
 * Responsible for the content footer of the layout.
 *  ___________________________________________________________________________
 * |                                                                           |
 * | [show your locked datasets/maps]           Page 2 of 42 [1] 2 [3][4][5]   |
 * |___________________________________________________________________________|
 *
 */
module.exports = CoreView.extend({
  events: {
    [`click #${filterShortcutId} a`]: navigateThroughRouter
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    if (!options.el) throw new Error('The root element must be provided from parent view');

    this.collection = options.collection;
    this.router = options.router;
    this.listenTo(this.router.model, 'change', this.render);

    this._createPaginationView(this.collection, this.router);
    this._setupFilterShortcut(this.collection, this.router);
  },

  render: function () {
    this.clearSubViews();

    this._renderFilterShortcut();
    this._renderPaginationView();

    return this;
  },

  _createPaginationView: function (collection, router) {
    const model = new PaginationModel({
      current_page: router.model.get('page'),
      url_to: page => router.currentUrl({ page: page })
    });

    // Some properties (e.g. total_entries) cannot be observed, so listen to all changes and update model accordingly
    this.listenTo(collection, 'all', _.partial(this._updatePaginationModelByCollection, model, collection));
    this.listenTo(router.model, 'change', _.partial(this._updatePaginationModelByRouter, model, router.model));

    this.paginationView = new PaginationView({
      model,
      routerModel: this.router
    });
    this.addView(this.paginationView);
  },

  _updatePaginationModelByCollection: function (model, collection) {
    model.set({
      per_page: collection.options.get('per_page'),
      total_count: collection.total_entries
    });
  },

  _updatePaginationModelByRouter: function (model, routerModel) {
    model.set('current_page', routerModel.get('page'));
  },

  _renderFilterShortcut: function () {
    // Create DOM placeholder for first render..
    this.$el.append(`<div id="${filterShortcutId}"></div>`);

    // ..for subsequent render simply replace the placeholder's content (by overriding this fn to):
    this._renderFilterShortcut = function () {
      let html = '';

      const rModel = this.router.model;
      const currentUrl = this.router.currentDashboardUrl();
      const totalCount = this.filterShortcutVis.total_entries;
      const templateData = {
        totalCount,
        pluralizedContents: this._pluralizedContentType(totalCount),
        url: rModel.get('locked') ? currentUrl : currentUrl.lockedItems()
      };

      if (rModel.get('locked')) {
        html = filterShortcutNonLockedTemplate(templateData);
      } else if (totalCount > 0 && this._isLockInfoNeeded()) {
        html = filterShortcutLockedTemplate(templateData);
      }

      this.$(`#${filterShortcutId}`).html(html);
    };
  },

  _pluralizedContentType: function (totalCount) {
    const contentTypeWithoutTrailingS = this.router.model.get('content_type').slice(0, -1);
    return pluralizeString(contentTypeWithoutTrailingS, totalCount);
  },

  _setupFilterShortcut: function (collection, router) {
    this.filterShortcutVis = new VisualizationsCollection([], { configModel: this._configModel });
    this.listenTo(collection, 'loaded', this._updateFilterShortcut);
  },

  _isLockInfoNeeded: function () {
    return this.router.model.get('shared') === 'no' &&
      !this.router.model.get('library') &&
      !this.router.model.isSearching();
  },

  _updateFilterShortcut: function () {
    if (this._isLockInfoNeeded()) {
      this.filterShortcutVis.options.set({
        locked: !this.router.model.get('locked'),
        shared: 'no',
        page: 1,
        per_page: 1,
        only_liked: this.router.model.get('liked'),
        q: this.router.model.get('q'),
        tag: this.router.model.get('tags'),
        type: this.router.model.get('content_type') === 'datasets' ? 'table' : 'derived'
      });

      this.filterShortcutVis.fetch({
        success: c => {
          this.render();
        }
      });
    } else {
      this.render();
    }
  },

  _renderPaginationView: function () {
    this.paginationView.render();
    this.$el.append(this.paginationView.el);
  }
});
