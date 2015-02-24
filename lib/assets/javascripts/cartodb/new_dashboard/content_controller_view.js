var $ = require('jquery');
var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');

var FiltersView = require('./filters_view');
var ListView = require('./list_view');
var ContentResult = require('./content_result_view');
var OnboardingView = require('./onboarding_view');
var ContentFooterView = require('./content_footer/view');

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
    this.collection.bind('add remove', this._onDataChange, this);
    this.collection.bind('error', this._onDataError, this);

    // Binding window scroll :(
    $(window).bind('scroll', this._onWindowScroll);

    this.add_related_model(this.router.model);
    this.add_related_model(this.collection);
  },

  _initViews: function() {
    this.controlledViews = {};  // All available views
    this.enabledViews = [];     // Visible views

    var onboardingView = new OnboardingView({
      localStorage: this.localStorage,
      user:         this.user
    });
    this.controlledViews['onboarding'] = onboardingView;
    this.$el.prepend(onboardingView.render().el);
    this.addView(onboardingView);

    var filtersView = new FiltersView({
      el:           this.$('.Filters'),
      user:         this.user,
      router:       this.router,
      collection:   this.collection,
      localStorage: this.localStorage
    });
    filtersView.bind('datasetSelected', function(d) {
      this.trigger('datasetSelected', d, this);
    }, this);
    filtersView.bind('remoteSelected', function(d) {
      this.trigger('remoteSelected', d, this);
    }, this);

    this.controlledViews['filters'] = filtersView;
    filtersView.render();
    this.addView(filtersView);

    var noDatasetsView = new ContentResult({
      className:  'ContentResult no-datasets',
      user:       this.user,
      router:     this.router,
      collection: this.collection,
      template:   'new_dashboard/views/content_no_datasets'
    });

    this.controlledViews['no_datasets'] = noDatasetsView;
    this.$('.NoDatasets').append(noDatasetsView.render().el);
    this.addView(noDatasetsView);

    var listView = new ListView({
      user:         this.user,
      router:       this.router,
      collection:   this.collection
    });

    listView.bind('remoteSelected', function(d) {
      this.trigger('datasetSelected', d, this);
    }, this);

    this.controlledViews['list'] = listView;
    this.$('#content-list').append(listView.render().el);
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

    // No need to call render, will render itself upon initial collection fetch
    var contentFooter = new ContentFooterView({
      el:         this.$('#content-footer-inner'),
      model:      this.user,
      router:     this.router,
      collection: this.collection
    });

    this.controlledViews['content_footer'] = contentFooter;
    //Move element to end of the parent
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
        blocks.push('list', 'small_loader', 'content_footer');
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

    if (!this._isBlockEnabled('main_loader') && !this._isBlockEnabled('small_loader')) {
      this._showBlocks(this.enabledViews.concat([ 'small_loader' ]));
    }
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
      if (!tag && !q && !shared && !locked && !liked) {

        if (this.router.model.get('content_type') === "maps") {
          // If there is no maps, let's show onboarding
          this.$el.addClass('on-boarding');
          activeViews.push('onboarding');
        } else if (!library && this.router.model.get('content_type') === "datasets") {
          // If there isn't any dataset, it should go to library endpoint
          var datasetsUrl = this.router.currentUserUrl.datasetsUrl();
          this.router.navigate(datasetsUrl.toLibrary(), { trigger: true });
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
    // Show small loader
    this._showBlocks([ 'small_loader' ]);
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
  }

});
