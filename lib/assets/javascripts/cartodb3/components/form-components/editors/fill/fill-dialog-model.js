var Backbone = require('backbone');
var CoreView = require('backbone/core-view');

/**
 * View model of the fill dialog
 */
module.exports = Backbone.Model.extend({

  defaults: {
    visible: true,
    createContentView: function () {
      return new CoreView();
    }
  },

  createContentView: function () {
    return this.get('createContentView')(this);
  },

  show: function () {
    this.set('visible', true);
  },

  hide: function () {
    this.set('visible', false);
  },

  isHidden: function () {
    return !this.get('visible');
  },

  /**
   * @override {Backbone.Model.prototype.destroy}
   */
  destroy: function () {
    var args = Array.prototype.slice.call(arguments);
    this.trigger.apply(this, ['destroy'].concat(args));
  }
});
