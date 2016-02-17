var _ = require('underscore');
var cdb = require('cartodb.js');

/**
 * View model for LoadingView component.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    desc: ''
  },

  initialize: function (attrs) {
    if (!attrs.title) throw new Error('title is required');
    if (!_.isFunction(attrs.predicate)) throw new Error('predicate is required (function)');
    if (!_.isFunction(attrs.createContentView)) throw new Error('createContentView is required (function)');
  },

  isReady: function () {
    return this.get('predicate')();
  },

  createContentView: function (opts) {
    return this.get('createContentView')(opts);
  }
});
