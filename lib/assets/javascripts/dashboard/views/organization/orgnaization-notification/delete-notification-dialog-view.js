const CoreView = require('backbone/core-view');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const Loading = require('builder/components/loading/render-loading');
const template = require('./delete-notification-dialog.tpl');

var REQUIRED_OPTS = [
  'configModel',
  'modalModel'
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
      formAction: `${this._configModel.prefixUrl()}/organization/notifications/${notificationId}`,
      authenticityToken
    }));
  },

  _onSubmit: function () {
    const loadingView = new Loading({ title: 'Removing…' });
    this.append(loadingView.render().el);

    this.$('form').submit();
    this._closeDialog();
  },

  _closeDialog: function () {
    this._modalModel.destroy();
  }
});
