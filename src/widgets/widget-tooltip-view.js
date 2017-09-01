var cdb = require('cartodb.js');
var _ = require('underscore');

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
      throw new Error('context is not defined');
    }

    if (!opts.target) {
      throw new Error('target is not defined');
    }

    this._$context = this.options.context;
    this._target = this.options.target;
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);

    this._initBinds();
  },

  _initBinds: function () {
    this._$context.on('mouseover', this._target, this.show);
    this._$context.on('mouseout', this._target, this.hide);
  },

  _setPosition: function (target) {
    var $target = $(target);
    var targetWidth = $target.outerWidth();
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
    this._setValue(e.target);
    this._setPosition(e.target);
    this.render();
    cdb.core.View.prototype.show.call(this);
  },

  clean: function () {
    this._$context.off('mouseover mouseout');
    cdb.core.View.prototype.clean.call(this);
  }

});
