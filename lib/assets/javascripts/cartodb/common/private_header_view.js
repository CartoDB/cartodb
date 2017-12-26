var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var SettingsDropdown = require('./views/dashboard_header/settings_dropdown_view');
var UserNotifications = require('./views/dashboard_header/notifications/view');

/**
 * Responsible for the header part of the layout.
 * It's currently pre-rendered server-side, why the header element is required to be given when instantiating the view.
 */
module.exports = cdb.core.View.extend({
  className: 'Header CDB-Text',

  events: {
    'click .js-settings-dropdown': '_createSettingsDropdown'
  },

  initialize: function () {
    if (!this.options.viewModel) {
      throw new Error('viewModel is required');
    }

    this.template = cdb.templates.getTemplate('common/views/private_header');

    this._viewModel = this.options.viewModel;

    this._initBinds();
  },

  _initBinds: function () {
    this.model.bind('change', this.render, this);
  },

  render: function () {
    this.clearSubViews();

    var hasOrganization = this.model.isInsideOrg();

    this.$el.html(
      this.template({
        organizationName: hasOrganization && this.model.organization.get('name'),
        nameOrUsername: this.model.nameOrUsername(),
        avatar: this.model.get('avatar_url'),
        homeUrl: this.model.viewUrl().dashboard()
      })
    );

    this._renderBreadcrumbsDropdownLink();
    this._renderNotifications();
    this._renderLogoLink();

    return this;
  },

  _renderBreadcrumbsDropdownLink: function () {
    this.$('.js-breadcrumb-dropdown').html(
      cdb.templates.getTemplate('common/views/dashboard_header/breadcrumbs/dropdown_link')({
        title: this._viewModel.breadcrumbTitle(),
        dropdownEnabled: this._viewModel.isBreadcrumbDropdownEnabled()
      })
    );
  },

  _renderNotifications: function () {
    var userNotifications = new UserNotifications({
      user: this.model,
      localStorage: this.options.localStorage
    });

    this.$('.js-user-notifications').html(userNotifications.render().el);
    this.addView(userNotifications);
  },

  _renderLogoLink: function () {
    var template = cdb.templates.getTemplate('common/views/dashboard_header/logo');
    this.$('.js-logo').html(
      template({
        homeUrl: this.model.viewUrl().dashboard(),
        googleEnabled: this.model.featureEnabled('google_maps')
      })
    );
  },

  _createSettingsDropdown: function (event) {
    this.killEvent(event);

    this._setupDropdown(new SettingsDropdown({
      target: $(event.target),
      model: this.model, // a user model
      horizontal_offset: 18
    }));
  },

  _setupDropdown: function (dropdownView) {
    this._closeAnyOtherOpenDialogs();
    this.addView(dropdownView);

    dropdownView.on('onDropdownHidden', function () {
      dropdownView.clean();
    }, this);

    dropdownView.render();
    dropdownView.open();
  },

  _closeAnyOtherOpenDialogs: function () {
    cdb.god.trigger('closeDialogs');
  }
});
