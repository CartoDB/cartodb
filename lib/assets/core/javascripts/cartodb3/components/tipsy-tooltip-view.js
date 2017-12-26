var CoreView = require('backbone/core-view');
require('tipsy');

/**
 *  Tipsy tooltip view.
 *
 *  - Needs an element to work.
 *  - Inits tipsy library.
 *  - Clean bastard tipsy bindings easily.
 *
 */

module.exports = CoreView.extend({
  options: {
    gravity: 's',
    opacity: 1,
    fade: true
  },

  events: {
    'mouseenter': '_onMouseEnter',
    'mouseleave': '_onMouseLeave'
  },

  initialize: function (opts) {
    if (!opts.el) throw new Error('Element is needed to have tipsy tooltip working');

    this._mouseEnterAction = opts.mouseEnterAction;
    this._mouseLeaveAction = opts.mouseLeaveAction;
    this._tipsyOpenedManually = opts.trigger === 'manual';

    this._initTipsy();
  },

  _initTipsy: function () {
    this.$el.tipsy(this.options);
    this.tipsy = this.$el.data('tipsy');
  },

  _onMouseEnter: function () {
    this._mouseEnterAction && this._mouseEnterAction();
  },

  _onMouseLeave: function () {
    this._mouseLeaveAction && this._mouseLeaveAction();
  },

  setOffset: function (offset) {
    this.tipsy.options.offset = offset;
  },

  showTipsy: function () {
    this.$el.tipsy('show');
  },

  hideTipsy: function () {
    this.$el.tipsy('hide');
  },

  destroyTipsy: function () {
    if (this.tipsy) {
      // tipsy does not return this
      this.tipsy.hide();
      this.$el.unbind('mouseleave mouseenter');
    }

    if (this._tipsyOpenedManually) {
      this.hideTipsy();
    }

    this.$el.removeData('tipsy');
    delete this.tipsy;
  },

  clean: function () {
    this.destroyTipsy();
  }
});
