var $ = require('jquery');
var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');

var FiltersView = require('new_dashboard/filters_view');
var ListView = require('new_dashboard/list_view');
var ContentResult = require('new_dashboard/content_result_view');
var MapView = require('new_dashboard/map_view');

module.exports = cdb.core.View.extend({

  initialize: function() {
    this.user = this.options.user;
    this.router = this.options.router;
    this.localStorage = this.options.localStorage;

    this._initViews();
    this._initBindings();
  },

  _initBindings: function() {
    this.router.model.bind('change', this._onRouterChange, this);
    this.collection.bind('add remove reset', this._onDataFetched, this);
    this.collection.bind('error', this._onDataError, this);
    
    this.add_related_model(this.router.model);
    this.add_related_model(this.collection);
  },

  _initViews: function() {
    this.controlledViews = {};  // All available views
    this.enabledViews = [];     // Visible views

    var mapView = new MapView();
    this.controlledViews['map'] = mapView;
    this.$el.prepend(mapView.render().el);
    this.addView(mapView);

    var filtersView = new FiltersView({
      user:         this.user,
      router:       this.router,
      collection:   this.collection,
      localStorage: this.localStorage
    });

    this.controlledViews['filters'] = filtersView;
    this.$('.DashboardFilters > .u-inner').append(filtersView.render().el);
    this.addView(filtersView);

    var listView = new ListView({
      user:         this.user,
      router:       this.router,
      collection:   this.collection
    });

    this.controlledViews['list'] = listView;
    this.$('.ContentList').html(listView.render().el);
    this.addView(listView);

    var noResultsView = new ContentResult({
      router:     this.router,
      collection: this.collection,
      template:   'new_dashboard/views/content_no_results'
    });

    this.controlledViews['no_results'] = noResultsView;
    this.$el.append(noResultsView.render().el);
    this.addView(noResultsView);

    var errorView = new ContentResult({
      router:     this.router,
      collection: this.collection,
      template:   'new_dashboard/views/content_error'
    });

    this.controlledViews['error'] = errorView;
    this.$el.append(errorView.render().el);
    this.addView(errorView);

    var mainLoaderView = new ContentResult({
      router:     this.router,
      collection: this.collection,
      template:   'new_dashboard/views/content_loader'
    });

    this.controlledViews['main_loader'] = mainLoaderView;
    this.$el.append(mainLoaderView.render().el);
    this.addView(mainLoaderView);

    var smallLoaderView = new ContentResult({
      router:     this.router,
      collection: this.collection,
      template:   'new_dashboard/views/content_small_loader'
    });

    this.controlledViews['small_loader'] = smallLoaderView;
    this.$el.append(smallLoaderView.render().el);
    this.addView(smallLoaderView);
  },

  _onRouterChange: function(m, c) {
    var blocks = [];

    if (c && c.changes && c.changes.content_type) {
      // If it changes to a different type (or tables or visualizations)
      // Show the main loader
      blocks = [ 'filters', 'main_loader' ];
    } else {
      blocks = ['filters'];
      // If list was enabled, keep it visible
      if (this._isBlockEnabled('list')) {
        blocks.push('list', 'small_loader');
      } 
      // If no_results was enabled, keep it visible
      if (this._isBlockEnabled('no_results')) {
        blocks.push('main_loader');
      }
    }

    this._hideBlocks();
    this._showBlocks(blocks)
    
    this._scrollToTop();
  },

  _onDataFetched: function(coll, opts) {
    var activeViews = [ 'filters' ];
    var tag = this.router.model.get('tag');
    var q = this.router.model.get('q');
    var shared = this.router.model.get('shared');
    var liked = this.router.model.get('liked');
    var locked = this.router.model.get('locked');
    var library = this.router.model.get('library');

    if (coll.size() === 0) {
      if (!tag && !q && !shared && !locked && !liked) {
        
        if (this.router.model.get('content_type') === "maps") {
          // If there is no maps, let's show map (onboarding)
          activeViews.push('map');
        } else if (!library && this.router.model.get('content_type') === "datasets") {
          // If there isn't any dataset, it should go to library endpoint
          this.router.navigate(this.router.urls.byContentType('/library'), { trigger: true });
          return;
        } else {
          // None of the rest, no-results
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
      })
    } else {
      _.each(this.controlledViews, function(v){
        v.show();
        self.enabledViews.push(v);
      })
    }
  },

  _hideBlocks: function(views) {
    var self = this;
    if (views) {
      _.each(views, function(v){
        self.controlledViews[v].hide();
        self.enabledViews = _.without(self.enabledViews, v);
      })
    } else {
      _.each(this.controlledViews, function(v){
        v.hide();
        self.enabledViews = _.without(self.enabledViews, v);
      })
    }
  },

  _isBlockEnabled: function(name) {
    if (name) {
      return _.contains(this.enabledViews, name);
    }
    return false
  },

  _scrollToTop: function() {
    this.$el.animate({ scrollTop: 0 }, 550);
  }

});
