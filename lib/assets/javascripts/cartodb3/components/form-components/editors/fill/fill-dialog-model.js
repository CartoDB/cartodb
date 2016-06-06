var cdb = require('cartodb.js');

/**
 * View model of the fill dialog
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    visible: true,
    createContentView: function () {
      return new cdb.core.View();
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
