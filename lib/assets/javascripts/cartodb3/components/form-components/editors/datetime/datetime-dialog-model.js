var Backbone = require('backbone');
var CoreView = require('backbone/core-view');

/**
 * View model of the fill dialog
 */
module.exports = Backbone.Model.extend({

  defaults: {
    show: true,
  },

  show: function () {
    this.set('show', true);
  },

  hide: function () {
    this.set('show', false);
  },

  isHidden: function () {
    return !this.get('show');
  },

  /**
   * @override {Backbone.Model.prototype.destroy}
   */
  destroy: function () {
    var args = Array.prototype.slice.call(arguments);
    this.trigger.apply(this, ['destroy'].concat(args));
  }
});
