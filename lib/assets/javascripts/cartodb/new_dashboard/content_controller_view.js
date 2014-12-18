var $ = require('jquery');
var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');

var FiltersView = require('new_dashboard/filters_view');
var ListView = require('new_dashboard/list_view');
var ContentResult = require('new_dashboard/content_result_view')


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
    this.controlledViews = {};

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
      template:   'new_dashboard/views/content_loader'
    });

    this.controlledViews['small_loader'] = smallLoaderView;
    this.$el.append(smallLoaderView.render().el);
    this.addView(smallLoaderView);
  },

  _onRouterChange: function(m, c) {
    // If it changes to a different type (or tables or visualizations)
    // Show the main loader
    this._hideBlocks();

    if (c && c.changes && c.changes.model) {
      this._showBlocks([ 'filters', 'main_loader' ]);
    } else {
      this._showBlocks([ 'filters', 'small_loader' ]);
    }
    
    this._scrollToTop();
  },

  _onDataFetched: function(coll, opts) {
    var activeViews = [ 'filters', ( coll.size() === 0 ? 'no_results' : 'list' ) ];
    this._hideBlocks();
    this._showBlocks(activeViews);
  },

  _onDataError: function(e) {
    this._hideBlocks();
    this._showBlocks([ 'filters', 'error' ]);
  },

  _showBlocks: function(views) {
    if (views) {
      var self = this;
      _.each(views, function(v){
        self.controlledViews[v].show();
      })
    } else {
      _.each(this.controlledViews, function(v){
        v.show();
      })
    }
  },

  _hideBlocks: function(views) {
    if (views) {
      var self = this;
      _.each(views, function(v){
        self.controlledViews[v].hide();
      })
    } else {
      _.each(this.controlledViews, function(v){
        v.hide();
      })
    }
  },

  _scrollToTop: function() {
    this.$el.animate({ scrollTop: 0 }, 550);
  }

});
