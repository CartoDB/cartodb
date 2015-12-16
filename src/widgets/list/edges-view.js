var _ = require('underscore');
var cdb = require('cartodb.js');

/**
 *  List edges view:
 *
 *  - It shows the borders and the shadows, if needed.
 */
module.exports = cdb.core.View.extend({
  _TEMPLATE: ' ' +
    '<div class="CDB-Widget-listEdge CDB-Widget-listEdge--top">' +
    '<div class="CDB-Widget-listEdgeShadow js-topShadow"></div>' +
    '<div class="CDB-Widget-listEdgeBorder"></div>' +
    '</div>' +
    '<div class="CDB-Widget-listEdge CDB-Widget-listEdge--bottom">' +
    '<div class="CDB-Widget-listEdgeShadow js-bottomShadow"></div>' +
    '<div class="CDB-Widget-listEdgeBorder"></div>' +
    '</div>',

  initialize: function () {
    this._$target = this.options.$target;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    var template = _.template(this._TEMPLATE);
    this.$el.html(template());
    this._checkScroll();
    return this;
  },

  _initBinds: function () {
    var self = this;
    this._$target.bind('scroll', function () {
      self._checkScroll();
    });
  },

  _unbindScroll: function () {
    this._$target.unbind('scroll');
  },

  _checkScroll: function () {
    var currentScroll = this._$target.scrollTop();
    var maxScroll = this._$target.get(0).scrollHeight - this._$target.outerHeight();
    this.$('.js-topShadow').toggle(currentScroll !== 0);
    this.$('.js-bottomShadow').toggle(currentScroll !== maxScroll);
  },

  clean: function () {
    this._unbindScroll();
    cdb.core.View.prototype.clean.call(this);
  }

});
