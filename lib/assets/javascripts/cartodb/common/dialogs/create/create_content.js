var cdb = require('cartodb.js-v3');
var CreateHeader = require('./create_header');
var CreateFooter = require('./create_footer');
var CreateListing = require('./create_listing');
var CreateLoading = require('./create_loading');
var NavigationView = require('./listing/navigation_view');

/**
 *  Create content view
 *
 *  It will manage big components within dialog. They are:
 *
 *  - Create header
 *  - Navigation
 *  - Create body
 *  - Create footer
 *  - Create loading
 *
 */

module.exports = cdb.core.View.extend({

  events: {
    'click': '_onClickContent'
  },

  initialize: function() {
    this.user = this.options.user;
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this._initViews();
    this._setOption();
    return this;
  },

  _initViews: function() {
    // Create dialog header
    var createHeader = new CreateHeader({
      el: this.$('.CreateDialog-header'),
      user: this.user,
      model: this.model
    })
    createHeader.render();
    this.addView(createHeader);

    // Navigation view
    var navigationView = new NavigationView({
      el: this.$('.js-navigation'),
      user: this.user,
      routerModel: this.model.visFetchModel,
      createModel: this.model,
      collection: this.model.collection
    });
    navigationView.render();
    this.addView(navigationView);

    // Create dialog footer
    var createFooter = new CreateFooter({
      el: this.$('.CreateDialog-footer'),
      user: this.user,
      createModel: this.model
    });

    createFooter.render();
    this.addView(createFooter);

    // Create pane
    this.createPane = new cdb.ui.common.TabPane({
      el: this.$(".Dialog-body--create")
    });
    // Don't show navigation menu when
    // a map or dataset is being created
    this.createPane.bind('tabEnabled', function(tabName) {
      navigationView[tabName === "listing" ? 'show' : 'hide' ]();
    }, this);
    this.addView(this.createPane);

    // Create dialog loading state
    var createLoading = new CreateLoading({
      user: this.user,
      createModel: this.model
    });

    createLoading.render();
    this.createPane.addTab('loading', createLoading);

    // Create dialog listing
    this._createListing = new CreateListing({
      user: this.user,
      createModel: this.model
    });
    this._createListing.render();
    this.createPane.addTab('listing', this._createListing);
    this.addView(this._createListing);

    this.model.set('option', 'listing');
  },

  _setOption: function() {
    this.createPane.active(this.model.getOption());
  },

  _initBinds: function() {
    _.bindAll(this, '_onScrollContent');
    this.model.bind('change:option', this._setOption, this);
    this.model.bind('change:option', this._maybeShowOnboarding, this);
    this.$(".Dialog-body--create").bind('scroll', this._onScrollContent);
  },

  _maybeShowOnboarding: function() {
    if (this._onboardingView && this.model.showOnboarding()) {
      this._createListing.$el.append(this._onboardingView.render().el);
      this._onboardingView.show();
    }
  },

  _onClickContent: function() {
    cdb.god.trigger('closeDialogs');
  },

  _onScrollContent: function() {
    var isScrolled = this.$(".Dialog-body--create").scrollTop() > 0;
    this.$('.js-navigation').toggleClass('with-long-separator', !!isScrolled);
  },

  clean: function() {
    this.$(".Dialog-body--create").unbind('scroll', this._onScrollContent);
    this.elder('clean');
  }

});
