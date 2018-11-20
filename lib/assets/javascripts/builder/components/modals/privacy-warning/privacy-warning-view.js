var ConfirmationView = require('builder/components/modals/confirmation/modal-confirmation-view');
var IconView = require('builder/components/icon/icon-view');
var template = require('./privacy-warning.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'modalModel',
  'privacyType'
];

/**
 *  Privacy Warning modal dialog
 */
module.exports = ConfirmationView.extend({
  className: 'Dialog-content',

  events: {
    'click .js-confirm': '_onConfirm',
    'click .js-cancel': '_onDismiss'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    if (this.options.onConfirm) {
      this._onConfirmCallback = this.options.onConfirm;
    }

    if (this.options.onDismiss) {
      this._onDismissCallback = this.options.onDismiss;
    }
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template({
      type: this.options.type || 'visualization',
      selectedPrivacyType: this._privacyType
    }));

    var warningIcon = new IconView({
      placeholder: this.$el.find('.js-icon-warning'),
      icon: 'warning'
    });
    warningIcon.render();
    this.addView(warningIcon);

    return this;
  },

  _onConfirm: function () {
    this._modalModel.destroy();
    this._onConfirmCallback && this._onConfirmCallback();
  },

  _onDismiss: function () {
    this._modalModel.destroy();
    this._onDismissCallback && this._onDismissCallback();
  }
});
