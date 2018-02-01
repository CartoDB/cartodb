const CoreView = require('backbone/core-view');
const checkAndBuildOpts = require('cartodb3/helpers/required-opts');
const template = require('./regenerate-keys.tpl');

var REQUIRED_OPTS = [
  'modalModel'
];

module.exports = CoreView.extend({
  events: {
    'click .js-ok': '_regenerateKeys',
    'click .js-cancel': '_closeDialog'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  render: function () {
    return this.$el.html(
      template({
        type: this.options.type,
        scope: this.options.scope,
        form_action: this.options.formAction,
        authenticity_token: this.options.authenticityToken,
        method: this.options.method || 'post'
      })
    );
  },

  _regenerateKeys: function () {
    this.trigger('done');
    this._closeDialog();
  },

  _closeDialog: function () {
    this._modalModel.destroy();
  }
});
