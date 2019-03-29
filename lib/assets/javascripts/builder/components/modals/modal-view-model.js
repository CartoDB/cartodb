var Backbone = require('backbone');
var CoreView = require('backbone/core-view');

/**
 * View model of a modal
 */
module.exports = Backbone.Model.extend({

  defaults: {
    show: true,
    createContentView: function () {
      return new CoreView();
    }
  },

  createContentView: function () {
    return this.get('createContentView')(this);
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
