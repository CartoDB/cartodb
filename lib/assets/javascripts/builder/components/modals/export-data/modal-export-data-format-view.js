var CoreView = require('backbone/core-view');
var template = require('./modal-export-data-format.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'format',
  'isDisabled',
  'isChecked'
];

module.exports = CoreView.extend({
  tagName: 'li',
  className: 'Modal-listFormItem',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initViews: function () {
    this.$el.html(
      template({
        format: this._format,
        isDisabled: this._isDisabled,
        isChecked: this._isChecked
      })
    );

    this.$el.toggleClass('is-disabled', this._isDisabled);
  }
});
