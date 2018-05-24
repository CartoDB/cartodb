const _ = require('underscore');
const Backbone = require('backbone');
const CoreView = require('backbone/core-view');
const randomQuote = require('builder/components/loading/random-quote');
const ServiceItem = require('dashboard/components/service-item/service-item-view');
const template = require('./account-form.tpl');
const loadingTemplate = require('builder/components/loading/loading.tpl');
const DeleteAccountView = require('dashboard/components/delete-account/delete-account-view');

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
        loadingTemplate({
          title: this._renderModel.get('loadingText'),
          descHTML: randomQuote()
        })
      );
    } else {
      this.$el.html(template({
        isCartoDBHosted: this._configModel.get('cartodb_com_hosted'),
        formAction: this._configModel.prefixUrl() + '/account',
        username: this._getField('username'),
        errors: this._errors,
        isInsideOrg: this._userModel.isInsideOrg(),
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
    const services = this._getField('services');

    this.$('.js-deleteAccount').click(event => {
      event && event.preventDefault();
      this._setDeleteAccountView(event);
    });

    if (services && services.length) {
      _.each(services, function (service) {
        const serviceItem = new ServiceItem({
          model: new Backbone.Model(_.extend({ state: 'idle' }, service)),
          configModel: this._configModel
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

    const origin = this._getUserFields();
    const destination = this._getDestinationValues();
    const destinationKeys = _.keys(destination);
    const differenceKeys = _.filter(destinationKeys, key =>
      origin[key] !== destination[key]
    );

    const user = _.pick(destination, differenceKeys);

    this._updateUser(user);

    this._setLoading('Saving changes');
  },

  _updateUser: function (user) {
    this._client.putConfig({ user }, (errors, response, data) => {
      if (errors) {
        this.options.onError(data, errors);
        this.render();
      } else {
        this._getUser();
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

  _getDestinationValues: function () {
    return {
      username: this._username(),
      old_password: this._oldPassword(),
      new_password: this._newPassword(),
      confirm_password: this._confirmPassword()
    };
  },

  _username: function () {
    return this.$('#user_username').val();
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
