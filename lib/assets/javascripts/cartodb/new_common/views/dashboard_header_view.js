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

  initialize: function(args) {
    if (!args.el) {
      throw new Error('el element is required');
    }
    if (!args.viewModel) {
      throw new Error('viewModel is required');
    }
    if (!args.currentUserUrl) {
      if (args.router.currentUserUrl) {
        this.options.currentUserUrl = args.router.currentUserUrl;
      } else {
        throw new Error('currentUserUrl is required');
      }
    }

    this.viewModel = args.viewModel;
    this.viewModel.bind('change', this.render, this);
    this.add_related_model(this.viewModel);
  },

  render: function() {
    this.clearSubViews();

    this._renderBreadcrumbsDropdownLink();
    this._renderNotifications();
    this._renderLogoLink();

    return this;
  },

  _renderBreadcrumbsDropdownLink: function() {
    var template = cdb.templates.getTemplate('new_common/views/dashboard_header/breadcrumbs/dropdown_link');
    this.$('.js-breadcrumb-dropdown').html(template({
      title: this.viewModel.breadcrumbTitle()
    }));
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
    this.killEvent(ev);

    this._setupDropdown(new BreadcrumbsDropdown({
      target: $(ev.target),
      model: this.model,
      viewModel: this.options.viewModel,
      currentUserUrl: this.options.currentUserUrl,
      router: this.options.router, // optional
      horizontal_offset: -110,
      tick: 'center',
      template_base: 'new_common/views/dashboard_header/breadcrumbs/dropdown'
    }));
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
