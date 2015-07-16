var cdb = require('cartodb.js');
var CreateHeader = require('./create_header');
var CreateFooter = require('./create_footer');
var CreateTemplates = require('./create_templates');
var CreateListing = require('./create_listing');
var CreatePreview = require('./create_preview');
var CreateLoading = require('./create_loading');

/**
 *  Create content view
 *
 *  It will manage big components within dialog. They are:
 *
 *  - Create header
 *  - Create body
 *  - Create footer
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

    // Create dialog templates
    if (this.model.isMapType()) {
      // Create map templates list
      var createTemplates = new CreateTemplates({
        user: this.user,
        model: this.model
      });

      createTemplates.render();
      this.createPane.addTab('templates', createTemplates);

      // Create dialog template preview
      var createPreview = new CreatePreview({
        user: this.user,
        model: this.model
      });

      createPreview.render();
      this.createPane.addTab('preview', createPreview);
    } else {
      this.model.set('option', 'listing');
    }

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
