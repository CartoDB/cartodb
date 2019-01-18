var cdb = require('cartodb.js-v3');
var FiltersView = require('./filters/view');
var ListView = require('./content/list/view');
var ContentView = require('./content/view');
var DatasetsCollection = require('./datasets_collection');
var DataLibraryHeader = require('./header/view');


module.exports = cdb.core.View.extend({

  events: {
    'click .js-more': '_onClickMore'
  },

  initialize: function() {
    this._initModels();
    this._initViews();

    this._initBindings();
  },

  _initViews: function() {
    this.controlledViews = {};  // All available views
    this.enabledViews = [];     // Visible views

    var dataLibraryHeader = new DataLibraryHeader({
      model: this.model,
      collection: this.collection
    });

    this.addView(dataLibraryHeader);
    $('.js-Header--datalibrary').append(dataLibraryHeader.render().el);
    dataLibraryHeader.load();

    var filtersView = new FiltersView({
      el: this.$('.Filters'),
      collection: this.collection,
      model: this.model
    });
    filtersView.render();
    this.addView(filtersView);

    var moreView = new ContentView({
      model: this.model,
      collection: this.collection,
      template: 'data_library/content/more_template',
    });
    this.$el.append(moreView.render().el);
    this.addView(moreView);

    var listView = new ListView({
      collection: this.collection
    });
    this.$('.js-DataLibrary-content').append(listView.render().el);
    this.addView(listView);
    this.controlledViews['list'] = listView;

    var noResultsView = new ContentView({
      model: this.model,
      collection: this.collection,
      template: 'data_library/content/no_results_template',
    });
    this.$el.append(noResultsView.render().el);
    this.addView(noResultsView);
    this.controlledViews['no_results'] = noResultsView;

    var errorView = new ContentView({
      model: this.model,
      collection: this.collection,
      template: 'data_library/content/error_template'
    });
    this.$el.append(errorView.render().el);
    this.addView(errorView);
    this.controlledViews['error'] = errorView;

    var mainLoaderView = new ContentView({
      model: this.model,
      collection: this.collection,
      template: 'data_library/content/loader_template'
    });
    this.$el.append(mainLoaderView.render().el);
    this.addView(mainLoaderView);
    this.controlledViews['main_loader'] = mainLoaderView;
  },

  _fetchCollection: function() {
    this.collection.fetch();
  },

  render: function() {
    this._fetchCollection();

    return this;
  },

  _initBindings: function() {
    this.model.bind('change:show_more', this._onChangeShowMore, this);
    this.model.bind('change:vis_count', this._onChangeVisCount, this);

    this.collection.options.bind('change:tags', function() {
      this.model.set({ vis_count: 0 });
    }, this);
    this.collection.options.bind('change:bbox', function() {
      this.model.set({ vis_count: 0 });
    }, this);

    this.collection.options.bind('change', function() {
      this.model.set({ show_more: false });
      this._fetchCollection();
    }, this);
    this.collection.bind('reset', function() {
      this._onDataFetched();
    }, this);
    this.collection.bind('loading', function() {
      if (this.collection.options.get('page') === 1) {
        this._showLoader();
      } else {
        this._showLoaderOnly();
      }
    }, this);
    this.collection.bind('error', function(coll, e, opts) {
      if (!e || (e && e.statusText !== "abort")) {
        this._onDataError(e);
      }
    }, this);

    this.add_related_model(this.collection);
    this.add_related_model(this.collection.options);
  },

  _onChangeVisCount: function() {
    if (this.model.get('vis_count') >= this.collection.total_entries) {
      this.model.set({ show_more: false });
    } else {
      this.model.set({ show_more: true });
    }
  },

  _onChangeShowMore: function() {
    this.$('.js-more').toggleClass('is-hidden', !this.model.get('show_more'));
  },

  _onDataFetched: function() {
    var activeViews = [ ];

    if (this.collection.size() === 0) {
      activeViews.push('no_results');
    } else {
      this.model.set({ vis_count: this.model.get('vis_count') + this.collection.length, show_more: true });
      activeViews.push('list');
    }

    this._hideBlocks();
    this._showBlocks(activeViews);
  },

  _onDataError: function(e) {
    // Send error to TrackJS
    if (window.trackJs && window.trackJs.track) {
      window.trackJs.track(e);
    }

    this._hideBlocks();
    this._showBlocks([ 'error' ]);
  },

  _showBlocks: function(views) {
    var self = this;

    if (views) {
      _.each(views, function(v){
        self.controlledViews[v].show();
        self.enabledViews.push(v);
      });
    } else {
      self.enabledViews = [];
      _.each(this.controlledViews, function(v){
        v.show();
        self.enabledViews.push(v);
      });
    }
  },

  _hideBlocks: function(views) {
    var self = this;
    if (views) {
      _.each(views, function(v){
        self.controlledViews[v].hide();
        self.enabledViews = _.without(self.enabledViews, v);
      });
    } else {
      _.each(this.controlledViews, function(v){
        v.hide();
      });
      self.enabledViews = [];
    }
  },

  _isBlockEnabled: function(name) {
    if (name) {
      return _.contains(this.enabledViews, name);
    }

    return false;
  },

  _showLoader: function() {
    this._hideBlocks();
    this._showBlocks([ 'main_loader' ]);
  },

  _showLoaderOnly: function() {
    this._showBlocks([ 'main_loader' ]);
  },

  _hideLoader: function() {
    this._hideBlocks([ 'main_loader' ]);
  },

  _initModels: function() {
    this.model = new cdb.core.Model({
      vis_count: 0,
      show_countries: false,
      is_searching: false
    });

    this.collection = new DatasetsCollection();

    this._resetOptions();
  },

  _resetOptions: function() {
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

  _onClickMore: function(e) {
    this.killEvent(e);

    this.model.set({ show_more: false });

    this.collection.options.set({
      page: this.collection.options.get('page') + 1
    });
  }

});
