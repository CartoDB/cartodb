var Backbone = require('backbone');
var TipsyTooltipView = require('../tipsy-tooltip-view.js');

Backbone.Form.Field = Backbone.Form.Field.extend({

  // Changed original setError function in order to add
  // the error tooltip
  setError: function (msg) {
    if (this.editor.hasNestedForm) return;
    this.$el.addClass(this.errorClassName);
    this.setTooltip(msg);
  },

  // Changed original clearError function in order to remove
  // the error tooltip
  clearError: function () {
    this.$el.removeClass(this.errorClassName);
    this._destroyErrorTooltip();
  },

  setTooltip: function (msg, $el) {
    this._destroyErrorTooltip();
    this._errorTooltip = new TipsyTooltipView({
      el: $el || this.$el,
      gravity: 'w',
      className: 'is-error',
      offset: 5,
      title: function () {
        return msg;
      }
    });
    this._errorTooltip.showTipsy();
  },

  _destroyErrorTooltip: function () {
    if (this._errorTooltip) {
      this._errorTooltip.hideTipsy();
      this._errorTooltip.destroyTipsy();
    }
  },

  remove: function () {
    this._destroyErrorTooltip();
    this.editor.remove();
    Backbone.View.prototype.remove.call(this);
  }

}, {
  template: require('./field.tpl'),
  errorClassName: 'CDB-FieldError'
});
