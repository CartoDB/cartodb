var $ = require('jquery');
var cdb = require('cartodb.js');
var SettingsDropdown = require('./dashboard_header/settings_dropdown_view');
var BreadcrumbsDropdown = require('./dashboard_header/breadcrumbs/dropdown_view');
var UserNotifications = require('./dashboard_header/notifications/view');

/**
 * Responsible for the header part of the layout.
 * It's currently pre-rendered server-side, why the header element is required to be given when instantiating the view.
 */
module.exports = cdb.core.View.extend({
  events: {
    'click .js-breadcrumb-dropdown': '_createBreadcrumbsDropdown',
    'click .js-settings-dropdown': '_createSettingsDropdown'
  },

  initialize: function() {
    if (!this.options.el) {
      throw new Error('el element is required');
    }
    if (!this.options.viewModel) {
      throw new Error('viewModel is required');
    }
    if (!this.options.currentUserUrl) {
      if (this.options.router.currentUserUrl) {
        this.options.currentUserUrl = this.options.router.currentUserUrl;
      } else {
        throw new Error('currentUserUrl is required (either explicitly or implicitly through a router)');
      }
    }

    this._viewModel = this.options.viewModel;
    this._viewModel.bind('change', this.render, this);
    this.add_related_model(this._viewModel);
  },

  render: function() {
    this.clearSubViews();

    this._renderBreadcrumbsDropdownLink();
    this._renderNotifications();
    this._renderLogoLink();

    return this;
  },

  _renderBreadcrumbsDropdownLink: function() {
    this.$('.js-breadcrumb-dropdown').html(
      cdb.templates.getTemplate('new_common/views/dashboard_header/breadcrumbs/dropdown_link')({
        title: this._viewModel.breadcrumbTitle(),
        dropdownEnabled: this._viewModel.isBreadcrumbDropdownEnabled()
      })
    )
  },

  _renderNotifications: function() {
    var userNotifications = new UserNotifications({
      currentUserUrl: this.options.currentUserUrl,
      user: this.model,
      localStorage: this.options.localStorage
    });

    this.$('.js-user-notifications').html(userNotifications.render().el);
    this.addView(userNotifications);
  },

  _renderLogoLink: function() {
    var template = cdb.templates.getTemplate('new_common/views/dashboard_header/logo');
    this.$('.js-logo').html(
      template({
        homeUrl: this.options.currentUserUrl.toDashboard()
      })
    );
  },

  _createSettingsDropdown: function(ev) {
    this.killEvent(ev);

    this._setupDropdown(new SettingsDropdown({
      target: $(ev.target),
      model: this.model,
      currentUserUrl: this.options.currentUserUrl,
      horizontal_offset: 18
    }));
  },

  _createBreadcrumbsDropdown: function(ev) {
    if (this._viewModel.isBreadcrumbDropdownEnabled()) {
      this.killEvent(ev);
      this._setupDropdown(new BreadcrumbsDropdown({
        target: $(ev.target),
        model: this.model,
        viewModel: this._viewModel,
        currentUserUrl: this.options.currentUserUrl,
        router: this.options.router, // optional
        horizontal_offset: -110,
        tick: 'center',
        template_base: 'new_common/views/dashboard_header/breadcrumbs/dropdown'
      }));
    }
  },

  _setupDropdown: function(dropdownView) {
    this._closeAnyOtherOpenDialogs();
    this.addView(dropdownView);

    dropdownView.on('onDropdownHidden', function() {
      dropdownView.clean();
    }, this);

    dropdownView.render();
    dropdownView.open();
  },

  _closeAnyOtherOpenDialogs: function() {
    cdb.god.trigger("closeDialogs");
  }
});
