const $ = require('jquery');
const _ = require('underscore');
const Backbone = require('backbone');
const CoreView = require('backbone/core-view');
const PagesSubheader = require('dashboard/components/pages-subheader/pages-subheader.js');
const AccountFormView = require('./account-form-view');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');
const template = require('./account-content.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'userModel',
  'configModel',
  'flashMessageModel',
  'client'
];

module.exports = CoreView.extend({
  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._initModels();
    this._initBinds();
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:isLoading change:errors', this.render);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());
    this._initViews();
    return this;
  },

  _initModels: function () {
    this.model = new Backbone.Model();
    this.modals = new ModalsServiceModel();
  },

  _initViews: function () {
    const pagesSubheader = new PagesSubheader({
      userModel: this._userModel,
      configModel: this._configModel
    });
    this.$('.js-SideMenu').append(pagesSubheader.render().el);
    this.addView(pagesSubheader);

    const accountFormView = new AccountFormView({
      userModel: this._userModel,
      renderModel: this.model,
      configModel: this._configModel,
      modals: this.modals,
      setLoading: this._setLoading.bind(this),
      onSuccess: this._showSuccess.bind(this),
      onError: this._showErrors.bind(this),
      client: this._client,
      errors: this.model.get('errors')
    });

    this.$('.js-AccountContent').append(accountFormView.render().el);
    this.addView(accountFormView);
  },

  _setLoading: function (message) {
    this._flashMessageModel.hide();

    this.model.set({
      isLoading: !!message,
      loadingText: message,
      errors: []
    });
  },

  _setFlashMessage: function (data, message, type) {
    this._setLoading('');

    const jsonData = data && data.responseJSON || {};
    const errors = jsonData.errors;
    let flashMessage = jsonData.message;

    if (errors) {
      this.model.set({ errors });
    }

    if (!flashMessage) {
      flashMessage = message;
    }

    this._flashMessageModel.show(flashMessage, type);
  },

  _showSuccess: function (data) {
    $(window).scrollTop(0);

    _.extend(
      this._userModel.attributes,
      data.user_data
    );

    this._setFlashMessage(data, _t('account.flash_messages.save_changes.success'), 'success');

    if (data.mfa_required) {
      this._goToMultifactorAuthentication();
    }
  },

  _goToMultifactorAuthentication: function () {
    window.location = '/multifactor_authentication';
  },

  _showErrors: function (data) {
    $(window).scrollTop(0);
    this._setFlashMessage(data, _t('account.flash_messages.save_changes.error'), 'error');
  }
});
