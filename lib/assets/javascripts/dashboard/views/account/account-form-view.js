const _ = require('underscore');
const CoreView = require('backbone/core-view');
const moment = require('moment');
const randomQuote = require('builder/components/loading/random-quote');
const template = require('./account-form.tpl');
const accountFormExtensionTemplate = require('./account-form-extension.tpl');
const loadingTemplate = require('builder/components/loading/loading.tpl');
const DeleteAccountView = require('dashboard/components/delete-account/delete-account-view');
const PasswordValidatedForm = require('dashboard/helpers/password-validated-form');

const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'userModel',
  'renderModel',
  'configModel',
  'modals',
  'setLoading',
  'onSuccess',
  'onError',
  'client'
];

module.exports = CoreView.extend({
  events: {
    'click .js-save': '_onClickSave',
    'submit form': '_onClickSave',
    'change .js-toggle-mfa': '_onToggleMfa',
    'change .js-toggle-notification': '_onToggleNotification'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._initModels();
    this._initBinds();
  },

  _initModels: function () {
    this._errors = this.options.errors || {};
    this.add_related_model(this._renderModel);
    this._getNotifications();
  },

  _initBinds: function () {
    this._renderModel.bind('change:isLoading', this.render, this);
  },

  render: function () {
    this.clearSubViews();

    if (this._renderModel.get('isLoading')) {
      this.$el.html(
        loadingTemplate({
          title: this._renderModel.get('loadingText'),
          descHTML: randomQuote()
        })
      );
    } else {
      let templateParams = {
        isCartoDBHosted: this._configModel.isHosted(),
        formAction: this._configModel.prefixUrl() + '/account',
        username: this._getField('username'),
        errors: this._errors,
        isInsideOrg: this._userModel.isInsideOrg(),
        isAuthUsernamePasswordEnabled: this._getField('auth_username_password_enabled'),
        hidePasswordFields: this._userModel.isInsideOrg() && !this._getField('auth_username_password_enabled'),
        canChangePassword: this._getField('can_change_password'),
        isOrgOwner: this._userModel.isOrgOwner(),
        isOrgAdmin: this._userModel.isOrgAdmin(),
        isFree2020User: this._userModel.isFree2020User(),
        planName: this._getField('plan_name'),
        planUrl: this._getField('plan_url'),
        cantBeDeletedReason: this._getField('cant_be_deleted_reason'),
        services: this._getField('services') || [],
        mfaEnabled: this._getField('mfa_configured'),
        licenseExpiration: this._formatLicenseExpiration(),
        notifications: this._notifications || {},
        view: this
      };

      templateParams.accountFormExtension = accountFormExtensionTemplate(templateParams);

      this.$el.html(template(templateParams));

      this._initViews();

      this.onRenderFinished();
    }

    return this;
  },

  onRenderFinished: function () {
    // To be overriden by gears
  },

  _setDeleteAccountView: function (event) {
    this._modals.create(modalModel =>
      new DeleteAccountView({
        userModel: this._userModel,
        modalModel,
        onError: this._onError,
        client: this._client
      })
    );
  },

  _initViews: function () {
    this.$('.js-deleteAccount').click(event => {
      event && event.preventDefault();
      this._setDeleteAccountView(event);
    });
  },

  _getField: function (field) {
    return this._userModel.get(field);
  },

  _onClickSave: function (event) {
    this.killEvent(event);

    // updated user info
    const origin = this._getUserFields();
    const destination = this._getDestinationValues();
    const destinationKeys = _.keys(destination);
    const differenceKeys = _.filter(destinationKeys, key =>
      origin[key] !== destination[key]
    );
    const user = _.pick(destination, differenceKeys);

    // updated notifications info
    const notifications = this._getNotificationValuesFromUI();

    if (!this._userModel.get('needs_password_confirmation')) {
      this._updateUser(user);
      this._updateNotifications(notifications);
      return;
    }

    PasswordValidatedForm.showPasswordModal({
      modalService: this._modals,
      onPasswordTyped: (password) => {
        const onSuccess = () => {
          this._updateNotifications(notifications);
        };
        this._updateUser(user, password, onSuccess);
      },
      updatePassword: destination.new_password !== '' && destination.confirm_password !== ''
    });
  },

  _onToggleMfa: function (event) {
    this.killEvent(event);

    const newLabel = this._mfaStatus() ? _t('account.views.form.mfa_enabled') : _t('account.views.form.mfa_disabled');

    this._mfaLabel().html(newLabel);
  },

  _onToggleNotification: function (event) {
    this.killEvent(event);

    const id = event.target.id;
    const newLabel = (this._notificationStatus(id)
      ? _t('account.views.form.email_section.notifications.enabled')
      : _t('account.views.form.email_section.notifications.disabled')
    );

    this._notificationLabel(id).html(newLabel);
  },

  _updateUser: function (user, password, onSuccess) {
    this._setLoading('Saving changes');

    const userParams = { user: { ...user, password_confirmation: password } };
    this._client.putConfig(userParams, (errors, response, data) => {
      if (errors) {
        this.options.onError(data, errors);
        this.render();
      } else {
        this._getUser();
        onSuccess && onSuccess();
      }
    });
  },

  _getUser: function () {
    this._client.getConfig((errors, response, data) => {
      if (errors) {
        this.options.onError(data, response, errors);
      } else {
        this.options.onSuccess(data);
      }

      this.render();
    });
  },

  _getUserFields: function () {
    return {
      username: this._getField('username')
    };
  },

  _getNotifications: function () {
    this._client.emailNotifications().get((errors, response, data) => {
      if (errors) {
        this.options.onError(data, response, errors);
      } else {
        this._notifications = data.notifications;
      }

      this.render();
    });
  },

  _updateNotifications: function (notifications) {
    this._setLoading('Saving email notifications');

    this._client.emailNotifications().set(notifications, (errors, response, data) => {
      if (errors) {
        this.options.onError(data, errors);
        this.render();
      } else {
        this._getNotifications();
      }
    });
  },

  _getDestinationValues: function () {
    return {
      username: this._username(),
      new_password: this._newPassword(),
      confirm_password: this._confirmPassword(),
      mfa: this._mfaStatus()
    };
  },

  _getNotificationValuesFromUI: function () {
    return _.reduce(this._notifications, function (params, value, key) {
      params[key] = this._notificationStatus(key);
      return params;
    }, {}, this);
  },

  _username: function () {
    return this.$('#user_username').val();
  },

  _newPassword: function () {
    return this.$('#user_new_password').val();
  },

  _confirmPassword: function () {
    return this.$('#confirm_password').val();
  },

  _mfaStatus: function () {
    if (this.$('.js-toggle-mfa').length === 0) {
      return false;
    }
    return this.$('.js-toggle-mfa')[0].checked;
  },

  _mfaLabel: function () {
    return this.$('.js-mfa-label');
  },

  _notificationStatus: function (id) {
    const selector = `.js-toggle-notification-${id}`;
    if (this.$(selector).length === 0) {
      return false;
    }
    return this.$(selector)[0].checked;
  },

  _notificationLabel: function (id) {
    return this.$(`.js-notification-label-${id}`);
  },

  _formatLicenseExpiration: function () {
    if (!this._getField('license_expiration')) { return null; }

    const date = moment(this._getField('license_expiration'));
    return date.isValid() ? date.format('Do MMMM YYYY') : null;
  }
});
