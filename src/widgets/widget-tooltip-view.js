var cdb = require('cartodb.js');

/**
 * Standard widget tooltip view
 *
 */

var TOOLTIP_TRIANGLE = 10;

module.exports = cdb.core.View.extend({
  className: 'CDB-Widget-tooltip CDB-Widget-tooltip--light CDB-Text CDB-Size-small',

  options: {
    attribute: 'data-tooltip',
  },

  initialize: function (opts) {

    if (!opts.context) {
      throw new Error('context must be defined.');
    }

    this.hide = this.hide.bind(this);
    this.show = this.show.bind(this);

    this._$context = opts.context;
    this._target = opts.target;
    this._initBinds();
  },

  _initBinds: function () {
    if (this.options.event) {
      this._$context.on(this.options.event, this.show)
    } else {
      this._$context.on('mouseenter', this._target, this.show);
      this._$context.on('mouseleave', this._target, this.hide);
    }
  },

  _setPosition: function (target) {
    var $target = $(target);
    var targetWidth = $target.get(0).getBoundingClientRect().width; // for svg support as well
    var pos = $target.offset();
    var width = this.$el.outerWidth();
    var height = this.$el.outerHeight();

    this.$el.css({
      top: pos.top - height - TOOLTIP_TRIANGLE,
      left: pos.left + (targetWidth / 2) - (width / 2)
    });
  },

  _setValue: function (target) {
    var $target = $(target);
    var value = $target.attr(this.options.attribute);
    this.$el.html(value);
  },

  show: function (e) {
    if (!e || !e.target) {
      this.$el.fadeOut(70);
      return;
    }

    this._setValue(e.target);
    this._setPosition(e.target);
    this.render();
    this.$el.fadeIn(70);
  },

  clean: function () {
    this._$context.off('mouseenter mouseleave');
    cdb.core.View.prototype.clean.call(this);
  }

});
