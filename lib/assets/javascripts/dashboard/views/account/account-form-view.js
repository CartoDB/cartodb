const _ = require('underscore');
const Backbone = require('backbone');
const template = require('./account-form.tpl');
const CoreView = require('backbone/core-view');
var randomQuote = require('builder/components/loading/random-quote');
// var ServiceItem = require('./service_item_view');
var DeleteAccountView = require('dashboard/components/delete-account/delete-account-view');

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
    'submit form': '_onClickSave'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._initModels();
    this._initBinds();
  },

  _initModels: function () {
    this._errors = this.options.errors || {};
    this.add_related_model(this._renderModel);
  },

  _initBinds: function () {
    this._renderModel.bind('change:isLoading', this.render, this);
  },

  render: function () {
    this.clearSubViews();

    if (this._renderModel.get('isLoading')) {
      this.$el.html(
        this.getTemplate('common/templates/loading')({
          title: this._renderModel.get('loadingText'),
          quote: randomQuote()
        })
      );
    } else {
      this.$el.html(template({
        isCartoDBHosted: this._configModel.get('cartodb_com_hosted'),
        formAction: this._configModel.prefixUrl() + '/account',
        accountHost: this._configModel.get('account_host'),
        username: this._getField('username'),
        errors: this._errors,
        canChangeEmail: this._getField('can_change_email'),
        email: this._getField('email'),
        isInsideOrg: this._userModel.isInsideOrg(),
        organizationName: this._userModel.organization ? this._userModel.organization.get('name') : '',
        isAuthUsernamePasswordEnabled: this._getField('auth_username_password_enabled'),
        hidePasswordFields: this._userModel.isInsideOrg() && !this._getField('auth_username_password_enabled'),
        shouldDisplayOldPassword: this._getField('should_display_old_password'),
        canChangePassword: this._getField('can_change_password'),
        isOrgOwner: this._userModel.isOrgOwner(),
        planName: this._getField('plan_name'),
        planUrl: this._getField('plan_url'),
        cantBeDeletedReason: this._getField('cant_be_deleted_reason'),
        services: this._getField('services') || []
      }));

      this._initViews();
    }

    return this;
  },

  _setDeleteAccountView: function (event) {
    this._modals.create(() =>
      new DeleteAccountView({
        userModel: this._userModel,
        onError: this._onError,
        client: this._client
      })
    );
  },

  _initViews: function () {
    var services = this._getField('services');

    this.$('.js-deleteAccount').click(function (event) {
      event && event.preventDefault();
      this._setDeleteAccountView(event);
    }.bind(this));

    if (services && services.length > 0) {
      _.each(services, function (service) {
        var serviceItem = new ServiceItem({
          model: new Backbone.Model(_.extend({ state: 'idle' }, service))
        });

        this.$('.js-datasourcesContent').after(serviceItem.render().el);
        this.addView(serviceItem);
      }, this);
    }
  },

  _getField: function (field) {
    return this._userModel.get(field);
  },

  _onClickSave: function (event) {
    this.killEvent(event);

    var origin = this._getUserFields();
    var destination = this._getDestinationValues();
    var destinationKeys = _.keys(destination);

    var differenceKeys = _.filter(destinationKeys, function (key) {
      return origin[key] !== destination[key];
    });

    var user = _.pick(destination, differenceKeys);

    this._updateUser(user);

    this.setLoading('Saving changes');
  },

  _updateUser: function (user) {
    var self = this;

    this._client.putConfig({ user: user }, function (errors, response, data) {
      if (errors) {
        self.options.onError(data, errors);
        self.render();
      } else {
        self._getUser();
      }
    });
  },

  _getUser: function () {
    var self = this;

    this._client.getConfig(function (errors, response, data) {
      if (errors) {
        self.options.onError(data, response, errors);
      } else {
        self.options.onSuccess(data);
      }

      self.render();
    });
  },

  _getUserFields: function () {
    return {
      username: this._getField('username'),
      email: this._getField('email')
    };
  },

  _getDestinationValues: function () {
    return {
      username: this._username(),
      email: this._email(),
      old_password: this._oldPassword(),
      new_password: this._newPassword(),
      confirm_password: this._confirmPassword()
    };
  },

  _username: function () {
    return this.$('#user_username').val();
  },

  _email: function () {
    return this.$('#user_email').val();
  },

  _oldPassword: function () {
    return this.$('#user_old_password').val();
  },

  _newPassword: function () {
    return this.$('#user_new_password').val();
  },

  _confirmPassword: function () {
    return this.$('#confirm_password').val();
  }
});
