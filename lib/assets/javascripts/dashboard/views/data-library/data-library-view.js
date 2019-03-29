const $ = require('jquery');
const _ = require('underscore');
const Backbone = require('backbone');
const CoreView = require('backbone/core-view');
const FiltersView = require('dashboard/views/data-library/filters/filters-view');
const ListView = require('dashboard/views/data-library/content/list/list-view');
const ContentView = require('dashboard/views/data-library/content/content-view');
const DatasetsCollection = require('dashboard/data/datasets-collection');
const DataLibraryHeaderView = require('dashboard/views/data-library/header/header-view');
const moreTemplate = require('dashboard/views/data-library/content/more-template.tpl');
const noResultsTemplate = require('dashboard/views/data-library/content/no-results-template.tpl');
const errorTemplate = require('dashboard/views/data-library/content/error-template.tpl');
const loaderTemplate = require('dashboard/views/data-library/content/loader-template.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

module.exports = CoreView.extend({

  events: {
    'click .js-more': '_onClickMore'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initModels();
    this._initViews();
    this._initBinds();
  },

  render: function () {
    this._fetchCollection();

    return this;
  },

  _initModels: function () {
    this.model = new Backbone.Model({
      vis_count: 0,
      show_countries: false,
      is_searching: false
    });

    this.collection = new DatasetsCollection(null, { configModel: this._configModel });

    this._resetOptions();
  },

  _initViews: function () {
    this.controlledViews = {}; // All available views
    this.enabledViews = []; // Visible views

    const dataLibraryHeader = new DataLibraryHeaderView({
      model: this.model,
      collection: this.collection,
      configModel: this._configModel
    });
    $('.js-Header--datalibrary').append(dataLibraryHeader.render().el);
    this.addView(dataLibraryHeader);
    dataLibraryHeader.load();

    const filtersView = new FiltersView({
      collection: this.collection,
      model: this.model
    });
    $('.Filters').append(filtersView.render().el);
    this.addView(filtersView);

    const moreView = new ContentView({
      model: this.model,
      collection: this.collection,
      template: moreTemplate
    });
    this.$el.append(moreView.render().el);
    this.addView(moreView);

    const listView = new ListView({
      collection: this.collection,
      configModel: this._configModel
    });
    $('.js-DataLibrary-content').append(listView.render().el);
    this.addView(listView);
    this.controlledViews['list'] = listView;

    const noResultsView = new ContentView({
      model: this.model,
      collection: this.collection,
      template: noResultsTemplate
    });
    this.$el.append(noResultsView.render().el);
    this.addView(noResultsView);
    this.controlledViews['no_results'] = noResultsView;

    const errorView = new ContentView({
      model: this.model,
      collection: this.collection,
      template: errorTemplate
    });
    this.$el.append(errorView.render().el);
    this.addView(errorView);
    this.controlledViews['error'] = errorView;

    const mainLoaderView = new ContentView({
      model: this.model,
      collection: this.collection,
      template: loaderTemplate
    });
    this.$el.append(mainLoaderView.render().el);
    this.addView(mainLoaderView);
    this.controlledViews['main_loader'] = mainLoaderView;
  },

  _fetchCollection: function () {
    this.collection.fetch();
  },

  _initBinds: function () {
    this.model.bind('change:show_more', this._onChangeShowMore, this);
    this.model.bind('change:vis_count', this._onChangeVisCount, this);

    this.listenTo(this.collection.options, 'change:tags', this._resetVisCount);
    this.listenTo(this.collection.options, 'change:bbox', this._resetVisCount);
    this.listenTo(this.collection.options, 'change', this._onCollectionOptionsChange);

    this.listenTo(this.collection, 'reset loaded', this._onCollectionReset);
    this.listenTo(this.collection, 'loading', this._onCollectionLoading);
    this.listenTo(this.collection, 'error', this._onCollectionError);
  },

  _resetVisCount: function () {
    this.model.set({ vis_count: 0 });
  },

  _onCollectionOptionsChange: function () {
    this.model.set({ show_more: false });
    this._fetchCollection();
  },

  _onCollectionError: function (collection, event, opts) {
    if (!event || (event && event.statusText !== 'abort')) {
      this._onDataError(event);
    }
  },

  _onCollectionLoading: function () {
    if (this.collection.options.get('page') === 1) {
      this._showLoader();
    } else {
      this._showLoaderOnly();
    }
  },

  _onCollectionReset: function () {
    this._onDataFetched();
  },

  _onChangeVisCount: function () {
    if (this.model.get('vis_count') >= this.collection.total_entries) {
      this.model.set({ show_more: false });
    } else {
      this.model.set({ show_more: true });
    }
  },

  _onChangeShowMore: function () {
    this.$('.js-more').toggleClass('is-hidden', !this.model.get('show_more'));
  },

  _onDataFetched: function () {
    const activeViews = [];

    if (this.collection.size() === 0) {
      activeViews.push('no_results');
    } else {
      this.model.set({
        vis_count: this.model.get('vis_count') + this.collection.length,
        show_more: true
      });
      activeViews.push('list');
    }

    this._hideBlocks();
    this._showBlocks(activeViews);
  },

  _onDataError: function (error) {
    if (window.trackJs && window.trackJs.track) {
      window.trackJs.track(error);
    }

    this._hideBlocks();
    this._showBlocks(['error']);
  },

  _showBlocks: function (views) {
    if (views) {
      _.each(views, (view) => {
        this.controlledViews[view].show();
        this.enabledViews.push(view);
      });
    } else {
      this.enabledViews = [];

      _.each(this.controlledViews, (view) => {
        view.show();
        this.enabledViews.push(view);
      });
    }
  },

  _hideBlocks: function (views) {
    if (views) {
      _.each(views, (view) => {
        this.controlledViews[view].hide();
        this.enabledViews = _.without(this.enabledViews, view);
      });
    } else {
      _.each(this.controlledViews, (view) => {
        view.hide();
      });

      this.enabledViews = [];
    }
  },

  _isBlockEnabled: function (name) {
    if (name) {
      return _.contains(this.enabledViews, name);
    }

    return false;
  },

  _showLoader: function () {
    this._hideBlocks();
    this._showBlocks(['main_loader']);
  },

  _showLoaderOnly: function () {
    this._showBlocks(['main_loader']);
  },

  _hideLoader: function () {
    this._hideBlocks(['main_loader']);
  },

  _resetOptions: function () {
    this.collection.options.set({
      q: '',
      order: 'updated_at',
      page: 1,
      tags: '',
      bbox: '',
      source: [],
      type: 'table'
    });
  },

  _onClickMore: function (event) {
    this.killEvent(event);

    this.model.set({ show_more: false });

    this.collection.options.set({
      page: this.collection.options.get('page') + 1
    });
  }
});
