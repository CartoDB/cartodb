const CoreView = require('backbone/core-view');
const checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'modalModel',
  'onSubmit',
  'template'
];

module.exports = CoreView.extend({
  events: {
    'click .js-submit': '_onSubmitClicked',
    'click .js-cancel': '_closeDialog'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  render: function () {
    return this.$el.html(this._template());
  },

  _onSubmitClicked: function () {
    this._onSubmit();
    this._closeDialog();
  },

  _closeDialog: function () {
    this._modalModel.destroy();
  }
});
