var cdb = require('cartodb-deep-insights.js');
require('tipsy');

/**
 *  Tipsy tooltip view.
 *
 *  - Needs an element to work.
 *  - Inits tipsy library.
 *  - Clean bastard tipsy bindings easily.
 *
 */

module.exports = cdb.core.View.extend({
  options: {
    gravity: 's',
    opacity: 1,
    fade: true
  },

  initialize: function (opts) {
    if (!opts.el) throw new Error('Element is needed to have tipsy tooltip working');
    this._tipsyOpenedManually = opts.trigger === 'manual';
    this._initTipsy();
  },

  _initTipsy: function () {
    this.$el.tipsy(this.options);
    this.tipsy = this.$el.data('tipsy');
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
      this.$el.tipsy('hide');
    }
  },

  clean: function () {
    this.destroyTipsy();
  }
});
