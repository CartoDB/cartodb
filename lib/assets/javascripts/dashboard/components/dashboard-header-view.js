const $ = require('jquery');
const CoreView = require('backbone/core-view');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const logoTemplate = require('./dashboard-header/logo.tpl');
const dropdownLinkTemplate = require('./dashboard-header/breadcrumbs/dropdown-link.tpl');
const SettingsDropdownView = require('./dashboard-header/settings-dropdown-view');
const BreadcrumbsDropdown = require('./dashboard-header/breadcrumbs/dropdown-view');
const UserNotificationsView = require('./dashboard-header/notifications/user-notifications-view');

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
    this._renderNotifications();
    this._renderLogoLink();

    return this;
  },

  _initBinds: function () {
    this._viewModel.bind('change', this._renderBreadcrumbsDropdownLink, this);
    this.listenTo(this._viewModel, 'change', this._renderBreadcrumbsDropdownLink);

    if (this.router) {
      this.listenTo(this.router.model, 'change', this._onRouterChange);
    }
    if (this.collection) {
      this.listenTo(this.collection, 'reset', this._stopLogoAnimation);
      this.listenTo(this.collection, 'error', this._onCollectionError);
    }
  },

  _onCollectionError: function (col, e, opts) {
    // Old requests can be stopped, so aborted requests are not
    // considered as an error
    if (!e || (e && e.statusText !== 'abort')) {
      this._stopLogoAnimation();
    }
  },

  // TODO: Not sure if the changes made here are correct, because of backbone version changes
  _onRouterChange: function (m, c) {
    if (m.changed && !m.changed.content_type && this.collection.total_user_entries > 0) {
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
      configModel: this._configModel,
      organizationNotifications: this.options.organizationNotifications
    });

    this.$('.js-user-notifications').html(userNotifications.render().el);
    this.addView(userNotifications);
  },

  _renderLogoLink: function () {
    this.$('.js-logo').html(
      logoTemplate({
        homeUrl: this.model.viewUrl().dashboard(),
        googleEnabled: this.model.featureEnabled('google_maps')
      })
    );
  },

  _createSettingsDropdown: function (event) {
    this.killEvent(event);

    this._setupDropdown(new SettingsDropdownView({
      target: $(event.target),
      model: this.model, // a user model
      configModel: this._configModel,
      horizontalOffset: 15
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
        tick: 'center',
        template: require('dashboard/components/dashboard-header/breadcrumbs/dropdown.tpl'),
        horizontalOffset: this.options.breadcrumbsDropdownOffset
      }));
    }
  },

  _setupDropdown: function (dropdownView) {
    this._closeAnyOtherOpenDialogs();
    this._previousDropDown = dropdownView;
    this.addView(dropdownView);

    dropdownView.on('onDropdownHidden', function () {
      dropdownView.clean();
    }, this);

    dropdownView.render();
    dropdownView.open();
  },

  _closeAnyOtherOpenDialogs: function () {
    // TODO: This is not how it used to work, it used to listen to a global event
    if (this._previousDropDown) {
      this._previousDropDown.hide();
    }
  }
});
