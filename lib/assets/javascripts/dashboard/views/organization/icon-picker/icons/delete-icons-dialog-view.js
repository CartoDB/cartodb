const CoreView = require('backbone/core-view');
const template = require('./delete-icons-dialog.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'modalModel',
  'onSubmit'
];

module.exports = CoreView.extend({
  events: {
    'click .js-submit': '_onSubmitClicked',
    'click .js-cancel': '_closeDialog'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._numOfIcons = this.options.numOfIcons || 0;
  },

  render: function () {
    this.$el.html(template({
      numOfIcons: this._numOfIcons
    }));
  },

  _onSubmitClicked: function () {
    this._onSubmit();
    this._closeDialog();
  },

  _closeDialog: function () {
    this._modalModel.destroy();
  }
});
