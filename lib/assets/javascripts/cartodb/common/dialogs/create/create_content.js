var cdb = require('cartodb.js');
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

    this._onboardingView = this.model.createOnboardingView();
    if (this._onboardingView) {
      this.addView(this._onboardingView);
    }

    this.model.set('option', 'listing');
  },

  _setOption: function() {
    this.createPane.active(this.model.getOption());
  },

  _initBinds: function() {
    this.model.bind('change:option', this._setOption, this);
    this.model.bind('change:option', this._maybeShowOnboarding, this);
  },

  _maybeShowOnboarding: function() {
    if (this._onboardingView && this.model.showOnboarding()) {
      this._createListing.$el.append(this._onboardingView.render().el);
      this._onboardingView.show();
    }
  },

  _onClickContent: function() {
    cdb.god.trigger('closeDialogs');
  }

});
