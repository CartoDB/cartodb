const CoreView = require('backbone/core-view');
const template = require('./delete-account-view.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'userModel',
  'client',
  'onError'
];

/**
 *  When user wants to delete his own account
 */

module.exports = CoreView.extend({
  events: {
    'click .js-ok': '_onClickDelete',
    'submit .js-form': 'close'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    CoreView.prototype.initialize.apply(this);
    this._isLoading = false;
  },

  render: function () {
    return template({
      passwordNeeded: !!this._userModel.get('needs_password_confirmation'),
      isLoading: this._isLoading
    });
  },

  _onClickDelete: function (event) {
    const params = {
      deletion_password_confirmation: this.$('#deletion_password_confirmation').val()
    };

    this._isLoading = true;

    this.render();

    this._client.deleteUser(params, (errors, response, data) => {
      this._isLoading = false;
      this.render();

      if (errors) {
        this._onError(data, errors);
      } else {
        this._onSuccess(data);
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
