var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var PagesSubheader = require('../common/pages_subheader');
var AccountFormView = require('./account_form_view');

module.exports = cdb.core.View.extend({
  initialize: function () {
    _.each(['flashMessageModel'], function (name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);

    this.template = cdb.templates.getTemplate('account/views/account_content');

    this._initModels();
    this._initBinds();
  },

  _initBinds: function () {
    this.model.on('change:isLoading', this.render, this);
    this.model.on('change:errors', this.render, this);
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(this.template());

    this._initViews();

    return this;
  },

  _initModels: function () {
    this._userModel = this.options.user;
    this._client = this.options.client;
    this.model = new cdb.core.Model();
  },

  _initViews: function () {
    var pagesSubheader = new PagesSubheader({
      user: this._userModel
    });
    this.$('.js-SideMenu').append(pagesSubheader.render().el);
    this.addView(pagesSubheader);

    var accountFormView = new AccountFormView({
      user: this._userModel,
      errors: this.model.get('errors'),
      setLoading: this._setLoading.bind(this),
      onSuccess: this._showSuccess.bind(this),
      onError: this._showErrors.bind(this),
      renderModel: this.model,
      client: this._client
    });

    this.$('.js-AccountContent').append(accountFormView.render().el);
    this.addView(accountFormView);
  },

  _setLoading: function (message) {
    this.options.flashMessageModel.hide();

    this.model.set({
      isLoading: !!message,
      loadingText: message,
      errors: []
    });
  },

  _setFlashMessage: function (data, message, type) {
    this._setLoading('');

    var str;
    try {
      var errors = data && data.responseJSON.errors;

      this.model.set({
        errors: errors
      });

      str = data && data.responseJSON.message;
    } catch (err) {
      str = message;
    }

    this.options.flashMessageModel.show(str, type);
  },

  _showSuccess: function (data) {
    $(window).scrollTop(0);

    _.extend(this._userModel.attributes,
      data.user_data, {
      should_display_old_password: data.should_display_old_password
    });

    this._setFlashMessage(data, _t('account.flash_messages.save_changes.success'), 'success');
  },

  _showErrors: function (data) {
    $(window).scrollTop(0);
    this._setFlashMessage(data, _t('account.flash_messages.save_changes.error'), 'error');
  }
});
