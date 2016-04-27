var cdb = require('cartodb.js');

/**
 * View model of the fill dialog
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    show: true,
    createContentView: function () {
      return new cdb.core.View();
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
