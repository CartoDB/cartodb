const CoreView = require('backbone/core-view');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const template = require('./delete-notification-dialog.tpl');

var REQUIRED_OPTS = [
  'userModel',
  'modalModel',
  'authenticityToken',
  'notificationId'
];

module.exports = CoreView.extend({
  events: {
    'click .js-submit': '_onSubmit',
    'click .js-cancel': '_closeDialog'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  render: function () {
    const { authenticityToken, notificationId } = this.options;

    return this.$el.html(template({
      formAction: `${this._userModel.get('base_url')}/organization/notifications/${notificationId}`,
      authenticityToken
    }));
  },

  _onSubmit: function (event) {
    event.preventDefault();

    this.$('form').submit();
  },

  _closeDialog: function (event) {
    event && event.preventDefault();
    this._modalModel.destroy();
  }
});
