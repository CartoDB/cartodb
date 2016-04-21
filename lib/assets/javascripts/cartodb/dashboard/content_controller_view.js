var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
cdb.admin = require('cdb.admin');

var FiltersView = require('./filters_view');
var ListView = require('./list_view');
var ContentResult = require('./content_result_view');
var OnboardingView = require('./onboarding_view');
var ContentFooterView = require('./content_footer/view');
var LoadingLibraryView = require('./datasets/loading_library_view');

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
    this.collection.bind('reset', this._onDataFetched, this);
    this.collection.bind('loading', this._onDataLoading, this);
    this.collection.bind('add', this._onDataChange, this);
    this.collection.bind('error', function(col, e, opts) {
      // Old requests can be stopped, so aborted requests are not
      // considered as an error
      if (!e || (e && e.statusText !== "abort")) {
        this._onDataError()
      }
    }, this);

    // Binding window scroll :(
    $(window).bind('scroll', this._onWindowScroll);

    this.add_related_model(this.router.model);
    this.add_related_model(this.collection);
  },

  _initViews: function() {
    this.controlledViews = {};  // All available views
    this.enabledViews = [];     // Visible views

    var onboardingView = new OnboardingView({
      user: this.user
    });
    this.controlledViews['onboarding'] = onboardingView;
    this.$el.prepend(onboardingView.render().el);
    this.addView(onboardingView);

    var filtersView = new FiltersView({
      el:           this.$('.Filters'),
      headerHeight: this.options.headerHeight,
      user:         this.user,
      router:       this.router,
      collection:   this.collection,
      localStorage: this.localStorage
    });

    this.controlledViews['filters'] = filtersView;
    filtersView.render();
    this.addView(filtersView);

    var noDatasetsView = new ContentResult({
      className:  'ContentResult no-datasets',
      user:       this.user,
      router:     this.router,
      collection: this.collection,
      template:   'dashboard/views/content_no_datasets'
    });
    noDatasetsView.bind('connectDataset', function() {
      if (this.user && this.user.canCreateDatasets()) {
        cdb.god.trigger(
          'openCreateDialog',
          {
            type: 'dataset'
          }
        );
      }
    }, this);

    this.controlledViews['no_datasets'] = noDatasetsView;
    this.$('.NoDatasets').append(noDatasetsView.render().el);
    this.addView(noDatasetsView);

    var listView = new ListView({
      user:         this.user,
      router:       this.router,
      collection:   this.collection
    });

    var self = this;

    cdb.god.bind('onTemplateSelected', function(id) {
      if (self.player) {
        self.player.close();
      }
    });

    cdb.god.bind('startTutorial', function(id) {
      self._addVideoPlayer(id);
    });

    this._addVideoPlayer();

    this.controlledViews['list'] = listView;
    this.$('#content-list').append(listView.render().el);
    this.addView(listView);

    var noResultsView = new ContentResult({
      router:     this.router,
      collection: this.collection,
      template:   'dashboard/views/content_no_results',
    });

    this.controlledViews['no_results'] = noResultsView;
    this.$el.append(noResultsView.render().el);
    this.addView(noResultsView);

    var errorView = new ContentResult({
      router:     this.router,
      collection: this.collection,
      template:   'dashboard/views/content_error'
    });

    var loadingLibrary = new LoadingLibraryView();
    this.controlledViews['loading_library'] = loadingLibrary;
    this.$el.append(loadingLibrary.render().el);
    this.addView(loadingLibrary);

    this.controlledViews['error'] = errorView;
    this.$el.append(errorView.render().el);
    this.addView(errorView);

    var mainLoaderView = new ContentResult({
      router:     this.router,
      collection: this.collection,
      template:   'dashboard/views/content_loader'
    });

    this.controlledViews['main_loader'] = mainLoaderView;
    this.$el.append(mainLoaderView.render().el);
    this.addView(mainLoaderView);

    // No need to call render, will render itself upon initial collection fetch
    var contentFooter = new ContentFooterView({
      el:         this.$('#content-footer'),
      model:      this.user,
      router:     this.router,
      collection: this.collection
    });

    this.controlledViews['content_footer'] = contentFooter;
    // Move element to end of the parent, if not paginator will appear
    // before other elements
    this.$('#content-footer').appendTo(this.$el);
    this.addView(contentFooter);
  },

  _onRouterChange: function(m, c) {
    var blocks = [];

    if (c && c.changes && c.changes.content_type) {
      // If it changes to a different type (or tables or visualizations)
      // Show the main loader
      blocks = [ 'filters', 'main_loader' ];
    } else {
      blocks = ['filters'];

      if (this._isBlockEnabled('list') && this.collection.total_user_entries > 0) {
        // If list was enabled, keep it visible
        blocks.push('list', 'content_footer');
      } else {
        blocks.push('main_loader');
      }

      // If no_results was enabled, keep it visible
      if (this._isBlockEnabled('no_results') || this._isBlockEnabled('error')) {
        if (!_.contains(blocks, 'main_loader')) {
          blocks.push('main_loader');
        }
      }
    }

    this._hideBlocks();
    this._showBlocks(blocks);
    this._scrollToTop();
  },

  _onDataLoading: function() {
    this.$el.removeClass('on-boarding');
  },

  /**
   * Arguments may vary, depending on if it's the collection or a model that triggers the event callback.
   * @private
   */
  _onDataFetched: function() {
    var activeViews = [ 'filters', 'content_footer' ];
    var tag = this.router.model.get('tag');
    var q = this.router.model.get('q');
    var shared = this.router.model.get('shared');
    var liked = this.router.model.get('liked');
    var locked = this.router.model.get('locked');
    var library = this.router.model.get('library');

    if (library && this.collection.total_user_entries === 0) {
      activeViews.push('no_datasets');
    }

    if (this.collection.size() === 0) {
      if (!tag && !q && shared === "no" && !locked && !liked) {

        if (this.router.model.get('content_type') === "maps") {
          // If there is no maps, let's show onboarding
          activeViews = ['filters', 'no_results'];
          this.controlledViews['filters'].$el.removeClass('is-relative');
        } else if (library) {
          // Library is loaded async on 1st visit by user, so this code path is only reached until the library has been
          // stocked up. Show an intermediate loading info, and retry fetching data until while user stays here.
          // See https://github.com/CartoDB/cartodb/pull/2741 for more details.
          activeViews.push('loading_library');
          this.controlledViews['loading_library'].retrySoonAgainOrAbortIfLeavingLibrary(this.collection, this.router.model);
        } else if (!library && this.router.model.get('content_type') === "datasets") {
          this.router.navigate(
            this.collection.total_shared > 0 ?
              // If user has any shared dataset, let's go there
              this.user.viewUrl().dashboard().datasets().urlToPath('shared') :
              // If user doesn't have any shared dataset, time to visit data library
              this.user.viewUrl().dashboard().datasets().dataLibrary()
          , { trigger: true });
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

  _onDataChange: function() {
    // Fetch collection again to check if current
    // view has suffered a change
    this.collection.fetch();
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
      self.enabledViews = [];
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
      });
      self.enabledViews = [];
    }
  },

  _isBlockEnabled: function(name) {
    if (name) {
      return _.contains(this.enabledViews, name);
    }
    return false
  },

  _scrollToTop: function() {
    $('body').animate({ scrollTop: 0 }, 550);
  },


  _addVideoPlayer: function(id) {
    var opts = { id: id };

    this.player = new cdb.admin.VideoPlayer(opts);

    if (this.player.hasVideoData()) {
      this.$el.append(this.player.render().$el);
    }
  }

});
