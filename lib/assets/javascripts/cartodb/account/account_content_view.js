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
    this.model = new cdb.core.Model();
  },

  _initViews: function () {
    var pagesSubheader = new PagesSubheader({
      user: this._userModel
    });
    this.$('.js-SideMenu').append(pagesSubheader.render().el);

    var accountFormView = new AccountFormView({
      user: this._userModel,
      errors: this.model.get('errors'),
      setLoading: this._setLoading.bind(this),
      onSuccessSave: this._showSuccess.bind(this),
      onErrorSave: this._showErrors.bind(this),
      renderModel: this.model
    });
    this.$('.js-AccountContent').append(accountFormView.render().el);
  },

  _setLoading: function (message) {
    this.options.flashMessageModel.hide();

    this.model.set({
      isLoading: !!message,
      loadingText: message,
      errors: []
    });
  },

  _flattenErrors (arr) {
    return arr.reduce(function (flat, toFlatten) {
      return flat.concat(Array.isArray(toFlatten) ? this._flattenErrors(toFlatten) : toFlatten);
    }.bind(this), []);
  },

  _setFlashMessage: function (res, message, type) {
    this._setLoading('');

    var str;
    try {
      var errors = res && JSON.parse(res.responseText).errors;

      this.model.set({
        errors: errors
      });

      str = res && JSON.parse(res.responseText).message;
    } catch (err) {
      str = message;
    }

    this.options.flashMessageModel.show(str, type);
  },

  _showSuccess: function (model, response) {
    this._setFlashMessage(response, 'Your changes have been saved correctly.', 'success');
  },

  _showErrors: function (model, response) {
    this._setFlashMessage(response, 'Could not save profile, please try again.', 'error');
  }
});
