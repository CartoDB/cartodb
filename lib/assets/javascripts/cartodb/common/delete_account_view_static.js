var cdb = require('cartodb.js-v3');
var CartoApiClient = require('carto-api-client');
var BaseDialog = require('./views/base_dialog/view');

/**
 *  When user wants to delete his own account
 *
 */

module.exports = BaseDialog.extend({
  events: BaseDialog.extendEvents({
    'click .js-ok': '_onClickDelete',
    'submit .js-form': 'close'
  }),

  className: 'Dialog is-opening',

  initialize: function () {
    if (!this.options['onError']) throw new Error('onError is required');

    this.elder('initialize');

    this.template = cdb.templates.getTemplate('common/views/delete_account_static');
    this._initModels();
  },

  _initModels: function () {
    this._userModel = this.options.user;
    this._apiClient = CartoApiClient.AuthenticatedClient;
    this._isLoading = false;
  },

  render_content: function () {
    return this.template({
      passwordNeeded: !!this._userModel.get('needs_password_confirmation'),
      isLoading: this._isLoading
    });
  },

  _onClickDelete: function (event) {
    var self = this;
    var deletionPasswordConfirmation = this.$('#deletion_password_confirmation').val();

    var payload = {
      deletion_password_confirmation: deletionPasswordConfirmation
    };

    this.killEvent(event);
    this._isLoading = true;

    this._apiClient.deleteUser(payload)
      .then(function (data) {
        if (data.errors) {
          throw CartoApiClient.ApiClientError.send(data);
        }
        self._onSuccess(data);
      })
      .catch(function (error) {
        self._onError(error);
      });
  },

  _setHref: function (href) {
    window.location.href = href;
  },

  _onSuccess: function (data) {
    this._isLoading = false;
    this.render();
    this._setHref(data.logout_url);
    this.close();
  },

  _onError: function (error) {
    this._isLoading = false;
    this.render();
    this.options.onError(error);
    this.close();
  }
});
