var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var DatasetsList = require('./datasets_list_view');
var ContentResult = require('./datasets/content_result_view');
var DatasetsPaginator = require('./datasets/datasets_paginator_view');

/**
 *  Datasets list view
 *
 *  Show datasets view to select them for
 *  creating a map or importing a dataset
 *
 */

module.exports = cdb.core.View.extend({

  initialize: function () {
    this.user = this.options.user;
    this.createModel = this.options.createModel;
    this.routerModel = this.options.routerModel;

    this._initViews();
    this._initBindings();

    if (this.createModel.get('collectionFetched')) {
      this._onDataFetched();
    }
  },

  _initBindings: function () {
    this.routerModel.bind('change', this._onRouterChange, this);
    this.collection.bind('loading', this._onDataLoading, this);
    this.collection.bind('reset', this._onDataFetched, this);
    this.collection.bind('error', function (e) {
      // Old requests can be stopped, so aborted requests are not
      // considered as an error
      if (!e || (e && e.statusText !== 'abort')) {
        this._onDataError();
      }
    }, this);
    this.add_related_model(this.routerModel);
    this.add_related_model(this.createModel);
    this.add_related_model(this.collection);
  },

  _initViews: function () {
    this.controlledViews = {}; // All available views
    this.enabledViews = []; // Visible views

    var noDatasetsView = new ContentResult({
      className: 'ContentResult no-datasets',
      user: this.user,
      defaultUrl: this.options.defaultUrl,
      routerModel: this.routerModel,
      collection: this.collection,
      template: 'common/views/create/listing/content_no_datasets'
    });
    noDatasetsView.bind('connectDataset', function () {
      if (this.user.canCreateDatasets()) {
        this.createModel.set('listing', 'import');
      }
    }, this);
    noDatasetsView.render().hide();
    this.controlledViews.no_datasets = noDatasetsView;
    this.$el.append(noDatasetsView.el);
    this.addView(noDatasetsView);

    var listView = new DatasetsList({
      user: this.user,
      createModel: this.createModel,
      routerModel: this.routerModel,
      collection: this.collection
    });
    this.controlledViews.list = listView;
    this.$el.append(listView.render().el);
    this.addView(listView);

    var noResultsView = new ContentResult({
      defaultUrl: this.options.defaultUrl,
      routerModel: this.routerModel,
      collection: this.collection,
      template: 'common/views/create/listing/datasets_no_result'
    });
    noResultsView.render().hide();
    this.controlledViews.no_results = noResultsView;
    this.$el.append(noResultsView.el);
    this.addView(noResultsView);

    var errorView = new ContentResult({
      defaultUrl: this.options.defaultUrl,
      routerModel: this.routerModel,
      collection: this.collection,
      template: 'common/views/create/listing/datasets_error'
    });
    errorView.render().hide();
    this.controlledViews.error = errorView;
    this.$el.append(errorView.el);
    this.addView(errorView);

    var mainLoaderView = new ContentResult({
      defaultUrl: this.options.defaultUrl,
      routerModel: this.routerModel,
      collection: this.collection,
      template: 'common/views/create/listing/datasets_loader'
    });

    this.controlledViews.main_loader = mainLoaderView;
    this.$el.append(mainLoaderView.render().el);
    this.addView(mainLoaderView);

    var datasetsPaginator = new DatasetsPaginator({
      routerModel: this.routerModel,
      collection: this.collection
    });

    this.controlledViews.content_footer = datasetsPaginator;
    this.$el.append(datasetsPaginator.render().el);
    this.addView(datasetsPaginator);
  },

  _onRouterChange: function () {
    this._hideBlocks();
    this._showBlocks([ 'main_loader' ]);
  },

  /**
   * Arguments may vary, depending on if it's the collection or a model that triggers the event callback.
   * @private
   */
  _onDataFetched: function () {
    var activeViews = [ 'content_footer' ];
    var tag = this.routerModel.get('tag');
    var q = this.routerModel.get('q');
    var shared = this.routerModel.get('shared');
    var locked = this.routerModel.get('locked');
    var library = this.routerModel.get('library');
    var hasDataLibrary = cdb.config.get('data_library_enabled');

    if (library && this.collection.total_user_entries === 0) {
      activeViews.push('no_datasets');
    }

    if (this.collection.size() === 0) {
      if (!tag && !q && shared === 'no' && !locked) {
        if (!library && hasDataLibrary) {
          this.createModel.set('datasetsTabDisabled', true);
          this._goToLibrary();
          return;
        }

        if (!library && this.user.canCreateDatasets()) {
          this.createModel.set({
            datasetsTabDisabled: true,
            listing: 'import'
          });
          return;
        }

        activeViews.push('no_results');
      } else {
        activeViews.push('no_results');
      }
    } else {
      activeViews.push('list');
      this.routerModel.set('datasetsTabDisabled', false);
      this.createModel.set('datasetsTabDisabled', false);
    }

    this._hideBlocks();
    this._showBlocks(activeViews);
  },

  _onDataLoading: function () {
    this._hideBlocks();
    this._showBlocks([ 'main_loader' ]);
  },

  _onDataError: function (e) {
    this._hideBlocks();
    this._showBlocks([ 'error' ]);
  },

  _showBlocks: function (views) {
    var self = this;
    if (views) {
      _.each(views, function (v) {
        if (self.controlledViews[v]) {
          self.controlledViews[v].show();
          self.enabledViews.push(v);
        }
      });
    } else {
      self.enabledViews = [];
      _.each(this.controlledViews, function (v) {
        v.show();
        self.enabledViews.push(v);
      });
    }
  },

  _goToLibrary: function () {
    this.routerModel.set({
      shared: 'no',
      library: true,
      page: 1
    });
  },

  _hideBlocks: function (views) {
    var self = this;
    if (views) {
      _.each(views, function (v) {
        if (self.controlledViews[v]) {
          self.controlledViews[v].hide();
          self.enabledViews = _.without(self.enabledViews, v);
        }
      });
    } else {
      _.each(this.controlledViews, function (v) {
        v.hide();
      });
      self.enabledViews = [];
    }
  },

  _isBlockEnabled: function (name) {
    if (name) {
      return _.contains(this.enabledViews, name);
    }
    return false;
  }

});
