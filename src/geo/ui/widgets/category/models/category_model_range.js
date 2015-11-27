var _ = require('underscore');
var Backbone = require('backbone');
var Model = require('cdb/core/model');

/**
 *  This model is used for getting the total amount of values
 *  from the category.
 *
 */

module.exports = Model.extend({

  defaults: {
    url: '',
    totalCount: 0
  },

  url: function() {
    return this.get('url');
  },

  initialize: function() {
    this.bind('change:url', function() {
      this.fetch();
    }, this);
  },

  setUrl: function(url) {
    this.set('url', url);
  },

  parse: function(d) {
    return {
      totalCount: d.count
    };
  }
});
