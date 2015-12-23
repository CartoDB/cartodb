var cdb = require('cartodb.js');

/**
 * Default widget model
 */
module.exports = cdb.core.Model.extend({
  defaults: {
    collapsed: false
  },

  initialize: function (attrs, opts) {
    this.dataviewModel = opts.dataviewModel;
  },

  isCollapsed: function () {
    return this.get('collapsed');
  },

  toggleCollapsed: function () {
    this.set('collapsed', !this.get('collapsed'));
  }
});
