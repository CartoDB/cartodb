var _ = require('underscore');
var Backbone = require('backbone');

/**
 * Categories collection
 */
module.exports = Backbone.Collection.extend({

  comparator: function(a,b) {
    if (a.get('value') === b.get('value')) {
      return (a.get('selected') < b.get('selected')) ? 1 : -1;
    } else {
      return (a.get('value') < b.get('value')) ? 1 : -1;
    }
  }

});
