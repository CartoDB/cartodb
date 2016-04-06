var cdb = require('cartodb-deep-insights.js');
var _ = require('underscore');
var ContentResultView = require('./content-result-view');
var DatasetsListView = require('./datasets-list-view');
var DatasetsPaginationView = require('./datasets-pagination-view');
var noResultsTemplate = require('./no-datasets.tpl');
var datasetsNoResultTemplate = require('./datasets-no-result.tpl');
var datasetsErrorTemplate = require('./datasets-error.tpl');
var datasetsLoaderTemplate = require('./datasets-loader.tpl');

/**
 *  Datasets list view
 *
 *  Show datasets view to select them for
 *  creating a map or importing a dataset
 *
 */

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    if (!opts.createModel) throw new Error('createModel is required');
    if (!opts.userModel) throw new Error('userModel is required');

    this._createModel = opts.createModel;
    this._userModel = opts.userModel;
    this._routerModel = this._createModel.getVisualizationFetchModel();
    this._tablesCollection = this._createModel.getTablesCollection();

    this._initViews();
    this._initBinds();
  },

  _initBinds: function () {
    this._routerModel.bind('change', this._onRouterChange, this);
    this._tablesCollection.bind('loading', this._onDataLoading, this);
    this._tablesCollection.bind('sync', this._onDataFetched, this);
    this._tablesCollection.bind('error', function (e) {
      // Old requests can be stopped, so aborted requests are not
      // considered as an error
      if (!e || (e && e.statusText !== 'abort')) {
        this._onDataError();
      }
    }, this);
    this.add_related_model(this._routerModel);
    this.add_related_model(this._createModel);
    this.add_related_model(this._tablesCollection);
  },

  _initViews: function () {
    this.controlledViews = {}; // All available views
    this.enabledViews = []; // Visible views

    var noDatasetsView = new ContentResultView({
      className: 'ContentResult no-datasets',
      userModel: this._userModel,
      routerModel: this._routerModel,
      tablesCollection: this._tablesCollection,
      template: noResultsTemplate
    });
    noDatasetsView.bind('connectDataset', function () {
      if (this._userModel.canCreateDatasets()) {
        this._createModel.set('listing', 'import');
      }
    }, this);
    noDatasetsView.render().hide();
    this.controlledViews['no_datasets'] = noDatasetsView;
    this.$el.append(noDatasetsView.el);
    this.addView(noDatasetsView);

    var listView = new DatasetsListView({
      userModel: this._userModel,
      createModel: this._createModel
    });
    this.controlledViews.list = listView;
    this.$el.append(listView.render().el);
    this.addView(listView);

    var noResultsView = new ContentResultView({
      userModel: this._userModel,
      routerModel: this._routerModel,
      tablesCollection: this._tablesCollection,
      template: datasetsNoResultTemplate
    });
    noResultsView.render().hide();
    this.controlledViews.no_results = noResultsView;
    this.$el.append(noResultsView.el);
    this.addView(noResultsView);

    var errorView = new ContentResultView({
      userModel: this._userModel,
      routerModel: this._routerModel,
      tablesCollection: this._tablesCollection,
      template: datasetsErrorTemplate
    });
    errorView.render().hide();
    this.controlledViews.error = errorView;
    this.$el.append(errorView.el);
    this.addView(errorView);

    var mainLoaderView = new ContentResultView({
      userModel: this._userModel,
      routerModel: this._routerModel,
      tablesCollection: this._tablesCollection,
      template: datasetsLoaderTemplate
    });
    this.controlledViews.main_loader = mainLoaderView;
    this.$el.append(mainLoaderView.render().el);
    this.addView(mainLoaderView);

    var datasetsPaginationView = new DatasetsPaginationView({
      routerModel: this._routerModel,
      tablesCollection: this._tablesCollection
    });
    this.controlledViews.content_footer = datasetsPaginationView;
    this.$el.append(datasetsPaginationView.render().el);
    this.addView(datasetsPaginationView);
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
    var tag = this._routerModel.get('tag');
    var q = this._routerModel.get('q');
    var shared = this._routerModel.get('shared');
    var locked = this._routerModel.get('locked');
    var library = this._routerModel.get('library');

    if (library && this._tablesCollection.getTotalStat('total_user_entries') === 0) {
      activeViews.push('no_datasets');
    }

    if (this._tablesCollection.size() === 0) {
      if (!tag && !q && shared === 'no' && !locked) {
        if (!library) {
          this._goToLibrary();
          return;
        } else {
          activeViews.push('no_results');
        }
      } else {
        activeViews.push('no_results');
      }
    } else {
      activeViews.push('list');
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
    this._routerModel.set({
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
