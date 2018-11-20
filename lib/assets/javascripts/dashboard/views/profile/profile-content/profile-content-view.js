const _ = require('underscore');
const Backbone = require('backbone');
const CoreView = require('backbone/core-view');
const PagesSubheader = require('dashboard/components/pages-subheader/pages-subheader');
const ProfileFormView = require('dashboard/views/profile/profile-form/profile-form-view');
const template = require('./profile-content.tpl');

const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'userModel',
  'configModel',
  'flashMessageModel',
  'modals'
];

module.exports = CoreView.extend({
  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._initModels();
    this._initBinds();
  },

  _initBinds: function () {
    this.model.on('change:isLoading', this.render, this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    this._initViews();

    return this;
  },

  _initModels: function () {
    this.model = new Backbone.Model();
  },

  _initViews: function () {
    const pagesSubheader = new PagesSubheader({
      userModel: this._userModel,
      configModel: this._configModel
    });
    this.$('.js-SideMenu').append(pagesSubheader.render().el);
    this.addView(pagesSubheader);

    const profileFormView = new ProfileFormView({
      configModel: this._configModel,
      userModel: this._userModel,
      renderModel: this.model,
      modals: this._modals,
      setLoading: this._setLoading.bind(this),
      onSaved: this._showSuccess.bind(this),
      onError: this._showErrors.bind(this)
    });
    this.$('.js-ProfileContent').append(profileFormView.render().el);
    this.addView(profileFormView);
  },

  _setLoading: function (message) {
    this._flashMessageModel.hide();

    this.model.set({
      isLoading: !!message,
      loadingText: message
    });
  },

  _setFlashMessage: function (res, message, type) {
    this._setLoading('');

    const jsonData = res && res.responseJSON || {};
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

  _showSuccess: function (message, response, request) {
    this._setFlashMessage(response, 'Your changes have been saved correctly.', 'success');
  },

  _showErrors: function (message, response, request) {
    const responseJSON = message && message.responseJSON;
    let errors = responseJSON && responseJSON.message;

    if (responseJSON && responseJSON.errors) {
      errors = `${_.values(responseJSON.errors).join('. ')}.`;
    }

    this._setFlashMessage(response, errors || 'Could not save profile, please try again.', 'error');
  }
});
