var CoreView = require('backbone/core-view');
var template = require('./apply-button.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'onApplyClick',
  'overlayModel'
];

module.exports = CoreView.extend({
  events: {
    'click .js-apply': '_onClick'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initBinds();
  },

  render: function () {
    this.$el.html(template({
      disabled: this._isDisabled()
    }));

    return this;
  },

  _initBinds: function () {
    this.listenTo(this._overlayModel, 'change:visible', this.render);
  },

  _isDisabled: function () {
    return this._overlayModel.get('visible');
  },

  _onClick: function () {
    if (this._isDisabled()) return;

    this._onApplyClick();
  }
});
