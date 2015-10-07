var cdb = require('cartodb.js');
var FiltersView = require('./data_library_filters_view');
var ListView = require('./data_library_list_view');
var ContentView = require('./data_library_content_view');
var DatasetsCollection = require('./datasets_collection');


// var MapCardPreview = require('../common/views/mapcard_preview');
// var DataLibraryHeader = require('./data_library_header');


module.exports = cdb.core.View.extend({
  tagName: 'div',

  initialize: function() {
    this._initModels();
    this._initViews();

    this._initBindings();
  },

  _initViews: function() {
    this.controlledViews = {};  // All available views
    this.enabledViews = [];     // Visible views

    var filtersView = new FiltersView({
      el:           this.$('.Filters'),
      // headerHeight: this.options.headerHeight,
      // user:         this.user,
      // router:       this.router,
      collection: this.collection,
      model: this.model,
      // localStorage: this.localStorage
    });
    this.controlledViews['filters'] = filtersView;
    filtersView.render();
    this.addView(filtersView);

    var listView = new ListView({
      collection:   this.collection
    });
    this.$el.append(listView.render().el);
    this.addView(listView);
    this.$('.js-DataLibrary-content').append(listView.render().el);
    this.controlledViews['list'] = listView;

    var noResultsView = new ContentView({
      // router:     this.router,
      collection: this.collection,
      template: 'data_library/data_library_content_no_results_template',
    });
    this.$el.append(noResultsView.render().el);
    this.addView(noResultsView);
    this.controlledViews['no_results'] = noResultsView;

    var errorView = new ContentView({
      collection: this.collection,
      template: 'data_library/data_library_content_error_template'
    });
    this.$el.append(errorView.render().el);
    this.addView(errorView);
    this.controlledViews['error'] = errorView;

    var mainLoaderView = new ContentView({
      collection: this.collection,
      template: 'data_library/data_library_content_loader_template'
    });
    this.$el.append(mainLoaderView.render().el);
    this.addView(mainLoaderView);
    this.controlledViews['main_loader'] = mainLoaderView;
  },

  _fetchCollection: function() {
    var params = this.model.attributes;

    // TODO: review, should collection params really be set here?
    this.collection.options.set({
      // q: params.q,
      page: params.page || 1,
      tags: params.tags || '',
      order: params.order,
      type: params.type
    });

    this.collection.fetch();
  },

  render: function() {
    this._fetchCollection();

    return this;
  },

  _initBindings: function() {
    this.collection.bind('reset', function() {
      this._onDataFetched();
      // Check if view more button should be enabled
    }, this);
    this.collection.bind('loading', function() {
      this._showLoader();
    }, this);
    this.collection.bind('error', function() {
      this._onDataError();
    }, this);
  },

  // _updateCategoryDropdown: function() {

  // },

  _onDataFetched: function() {
    var activeViews = [ 'filters' ];
    // var tag_name = this.router.model.get('tag_name');
    // var q = this.router.model.get('q');

    if (this.collection.size() === 0) {
      activeViews.push('no_results');
    } else {
      activeViews.push('list');
    }

    this._hideBlocks();
    this._showBlocks(activeViews);
  },

  _onDataError: function(e) {
    this._hideBlocks();
    this._showBlocks([ 'filters', 'error' ]);
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

  _scrollToTop: function() {
    $('body').animate({ scrollTop: 0 }, 550);
  },

  _showLoader: function() {
    this._hideBlocks();
    this._showBlocks([ 'main_loader' ]);
  },

  _hideLoader: function() {
    this._hideBlocks([ 'main_loader' ]);
  },

  _initModels: function() {
    this.model = new cdb.core.Model({
      q: '',
      order: 'updated_at',
      page: 1,
      tags: 'US Census',
      bbox: [],
      source: [],
      type: 'table'
    });

    this.collection = new DatasetsCollection();
  },

  // _renderItems: function() {

  // },

  // _resetOptions: function() {

  // },

  _renderStaticMap: function(vis, $el) {
    var visId = vis.get('id');
    var username = vis.get('permission').owner.username;
    var className = 'is-' + this.model.get('size');

    if (visId && username) {
      vis.set('rendered_' + this.model.get('size'), true);

      this.addView(
        new MapCardPreview({
          el: $el.find('.js-header'),
          width: 298,
          height: 220,
          username: username,
          visId: visId,
          className: className,
          mapsApiHost: cdb.config.getMapsApiHost()
        }).load()
      );
    }
  }

});
