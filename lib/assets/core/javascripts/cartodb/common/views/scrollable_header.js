var cdb = require('cartodb.js-v3');

module.exports = cdb.core.View.extend({

  initialize: function() {
    _.bindAll(this, '_onWindowScroll');
    this._bindScroll();
  },

  _onWindowScroll: function() {
    this.$el.toggleClass('is-fixed', $(window).scrollTop() > this.options.anchorPoint);
  },

  _unbindScroll: function() {
    $(window).unbind('scroll', this._onWindowScroll);
  },

  _bindScroll: function() {
    this._unbindScroll();
    $(window).bind('scroll', this._onWindowScroll);
  },

  clean: function() {
    this._unbindScroll();
    this.elder('clean');
  }
});
