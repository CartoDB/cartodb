var cdb = require('cartodb.js-v3');
var BaseDialog = require('./views/base_dialog/view');

/**
 *  When user wants to delete their own account
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
    this._client = this.options.client;
    this._isLoading = false;
  },

  render_content: function () {
    return this.template({
      passwordNeeded: !!this._userModel.get('needs_password_confirmation'),
      isLoading: this._isLoading
    });
  },

  _onClickDelete: function (event) {
    this.killEvent(event);
    this._isLoading = true;

    var deletionPasswordConfirmation = this.$('#deletion_password_confirmation').val();

    var params = {
      deletion_password_confirmation: deletionPasswordConfirmation
    };

    this.render();

    var self = this;
    this._client.deleteUser(params, function (errors, response, data) {
      self._isLoading = false;
      self.render();

      if (errors) {
        self._onError(data, errors);
      } else {
        self._onSuccess(data);
      }
    });
  },

  _setHref: function (href) {
    window.location.href = href;
  },

  _onSuccess: function (data) {
    this._setHref(data.logout_url);
    this.close();
  },

  _onError: function (data, errors) {
    this.options.onError(data, errors);
    this.close();
  }
});
