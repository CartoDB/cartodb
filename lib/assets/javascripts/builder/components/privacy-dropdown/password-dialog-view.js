var CoreView = require('backbone/core-view');
var template = require('./password-dialog.tpl');
var _ = require('underscore');

var REQUIRED_OPTS = [
  'onBack',
  'onEdit'
];

var ESCAPE_KEY_CODE = 27;
var ENTER_KEY_CODE = 13;

module.exports = CoreView.extend({
  className: 'Editor-boxModal Editor-PrivacyDialog',

  events: {
    'click .js-back': '_onClickBack',
    'keyup .js-input': '_onKeyUpInput'
  },

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (opts[item] === undefined) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);
  },

  render: function () {
    this.$el.empty();
    this.$el.html(template());
    return this;
  },

  _onKeyUpInput: function (e) {
    if (e.which === ESCAPE_KEY_CODE) {
      this._onBack();
    }

    if (e.which === ENTER_KEY_CODE) {
      this._onEdit && this._onEdit(this.getValue());
    }
  },

  _onClickBack: function () {
    this._onBack();
  },

  getValue: function () {
    return this.$('.js-input').val();
  }
});
