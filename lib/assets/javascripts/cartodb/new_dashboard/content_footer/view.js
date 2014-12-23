var cdb = require('cartodb.js');
var PaginationModel = require('new_common/pagination/model');
var PaginationView = require('new_common/pagination/view');
var pluralizeString = require('new_common/view_helpers/pluralize_string');
var handleAHref = require('new_common/view_helpers/handle_a_href_on_click');

var lockedVisId = 'locked-vis';
var events = {};
events['click #'+ lockedVisId +' a'] = handleAHref;

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
    this.add_related_model(this.router);

    this._createPaginationView(this.collection, this.router);
    this._setupLockedVis(this.collection, this.router);
  },

  render: function() {
    this.clearSubViews();

    this._renderShowLockedVisLink();
    this._renderPaginationView();

    return this;
  },

  _createPaginationView: function(collection, router) {
    var model = new PaginationModel({
      current_page: router.model.get('current_page'),
      url_to:       function(page) { return router.model.url({ page: page }) }
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

  _renderShowLockedVisLink: function() {
    // Create DOM placeholder for first render..
    this.$el.append('<div id="' + lockedVisId + '"></div>');

    // ..for subsequent render simply replace the placeholder's content:
    this._renderShowLockedVisLink = function() {
      var html = '';
      var rModel = this.router.model;
      var totalCount = this.lockedVis.total_entries;

      if (totalCount > 0 && !rModel.get('locked') && !rModel.get('shared')) {
        var contentTypeWithoutTrailingS = rModel.get('content_type').slice(0, -1);
        html = this.lockedVisTemplate({
          totalCount:         totalCount,
          pluralizedContents: pluralizeString(contentTypeWithoutTrailingS, totalCount),
          url:                rModel.lockedUrl()
        });
      }

      this.$('#'+ lockedVisId).html(html);
    }
  },

  /**
   * TODO: this method was code migrated from old dashboard (see dashboard/dashboard_paginator.js), this needs
   * a refactoring to handle this use-case better though, a lot of of the logic do not belong in this view.
   * @private
   */
  _setupLockedVis: function(collection, router) {
    this.lockedVisTemplate = cdb.templates.getTemplate('new_dashboard/content_footer/locked_vis/template');
    this.lockedVis = new cdb.admin.Visualizations();
    router.model.bind('change', this._updateLockedVis, this);
  },

  _updateLockedVis: function() {
    var self = this;

    var rModel = this.router.model;
    this.lockedVis.options.set(
      _.extend(
        this.collection.options.toJSON(),
        {
          locked:         true,
          exclude_shared: true,
          page:           1,
          per_page:       1,
          q:              '',
          tags:           '',
          type:           rModel.get('content_type') === 'datasets' ? 'table' : 'derived'
        }
      )
    );
    this.lockedVis.fetch({
      success: function(c) {
        if (c.size() > 0) {
          self.render();
        }
      }
    });
  },

  _renderPaginationView: function() {
    this.paginationView.render();
    this.$el.append(this.paginationView.el);
  }
});
