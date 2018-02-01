const $ = require('jquery');
const CoreView = require('backbone/core-view');
const checkAndBuildOpts = require('../../cartodb3/helpers/required-opts');
const logoTemplate = require('./dashboard-header/logo.tpl');
const dropdownLinkTemplate = require('./dashboard-header/breadcrumbs/dropdown-link.tpl');
const SettingsDropdownView = require('./dashboard-header/settings-dropdown-view');
const BreadcrumbsDropdown = require('./dashboard-header/breadcrumbs/dropdown-view');
const UserNotificationsView = require('./dashboard-header/notifications/user-notifications-view');
const UserSupportView = require('./dashboard-header/user-support-view');

const REQUIRED_OPTS = [
  'viewModel',
  'configModel'
];

/**
 * Responsible for the header part of the layout.
 * It's currently pre-rendered server-side, why the header element is required to be given when instantiating the view.
 */
module.exports = CoreView.extend({
  events: {
    'click .js-breadcrumb-dropdown': '_createBreadcrumbsDropdown',
    'click .js-settings-dropdown': '_createSettingsDropdown'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    if (!this.options.el) {
      throw new Error('el element is required');
    }

    this.router = this.options.router;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    this._renderBreadcrumbsDropdownLink();
    this._renderSupportLink();
    this._renderNotifications();
    this._renderLogoLink();

    return this;
  },

  _initBinds: function () {
    this._viewModel.bind('change', this._renderBreadcrumbsDropdownLink, this);
    if (this.router) {
      this.router.model.bind('change', this._onRouterChange, this);
      this.add_related_model(this.router.model);
    }
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

  _onRouterChange: function (m, c) {
    if (c && c.changes && !c.changes.content_type && this.collection.total_user_entries > 0) {
      this._startLogoAnimation();
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
      dropdownLinkTemplate({
        title: this._viewModel.breadcrumbTitle(),
        dropdownEnabled: this._viewModel.isBreadcrumbDropdownEnabled()
      })
    );
  },

  _renderNotifications: function () {
    var userNotifications = new UserNotificationsView({
      user: this.model,
      configModel: this._configModel
    });

    this.$('.js-user-notifications').html(userNotifications.render().el);
    this.addView(userNotifications);
  },

  _renderSupportLink: function () {
    var userSupportView = new UserSupportView({
      el: $('.js-user-support'),
      userModel: this.model
    });
    userSupportView.render();
  },

  _renderLogoLink: function () {
    this.$('.js-logo').html(
      logoTemplate({
        homeUrl: this.model.viewUrl().dashboard(),
        googleEnabled: this.model.featureEnabled('google_maps')
      })
    );
  },

  _createSettingsDropdown: function (ev) {
    this.killEvent(ev);

    this._setupDropdown(new SettingsDropdownView({
      target: $(ev.target),
      model: this.model, // a user model
      configModel: this._configModel,
      horizontal_offset: 18
    }));
  },

  _createBreadcrumbsDropdown: function (ev) {
    if (this._viewModel.isBreadcrumbDropdownEnabled()) {
      this.killEvent(ev);
      this._setupDropdown(new BreadcrumbsDropdown({
        target: $(ev.target),
        model: this.model,
        viewModel: this._viewModel,
        router: this.router, // optional
        horizontal_offset: -110,
        tick: 'center',
        template_base: 'common/views/dashboard_header/breadcrumbs/dropdown'
      }));
    }
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
    // TODO: Handle event
    // cdb.god.trigger("closeDialogs");
  }
});
