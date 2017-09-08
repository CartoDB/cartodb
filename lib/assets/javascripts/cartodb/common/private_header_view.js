var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var SettingsDropdown = require('./views/dashboard_header/settings_dropdown_view');
var UserNotifications = require('./views/dashboard_header/notifications/view');
var UserSupportView = require('./views/dashboard_header/user_support_view');

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

  render: function () {
    this.clearSubViews();

    var hasOrganization = this.model.isInsideOrg();

    this.$el.html(
      this.template({
        hasOrganization: hasOrganization,
        organizationName: hasOrganization && this.model.organization.get('name'),
        nameOrUsername: this.model.nameOrUsername(),
        avatar: this.model.get('avatar_url'),
        rootUrl: this.model.viewUrl().accountProfile().pathname()
      })
    );

    this._renderBreadcrumbsDropdownLink();
    this._renderSupportLink();
    this._renderNotifications();
    this._renderLogoLink();

    return this;
  },

  _initBinds: function () {
    this._viewModel.bind('change', this._renderBreadcrumbsDropdownLink, this);
    if (this.collection) {
      this.collection.bind('reset', this._stopLogoAnimation, this);
      this.collection.bind('error', this._onCollectionError, this);
      this.add_related_model(this.collection);
    }
    this.add_related_model(this._viewModel);
  },

  _onCollectionError: function (col, e, opts) {
    // Old requests can be stopped, so aborted requests are not
    // considered as an error
    if (!e || (e && e.statusText !== 'abort')) {
      this._stopLogoAnimation();
    }
  },

  _startLogoAnimation: function () {
    this.$('.Logo').addClass('is-loading');
  },

  _stopLogoAnimation: function () {
    this.$('.Logo').removeClass('is-loading');
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

  _renderSupportLink: function () {
    var userSupportView = new UserSupportView({
      el: $('.js-user-support'),
      model: this.model
    });
    userSupportView.render();
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

  _createSettingsDropdown: function (ev) {
    this.killEvent(ev);

    this._setupDropdown(new SettingsDropdown({
      target: $(ev.target),
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
