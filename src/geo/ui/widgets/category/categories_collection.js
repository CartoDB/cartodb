var _ = require('underscore');
var Backbone = require('backbone');

/**
 * Categories collection
 */
module.exports = Backbone.Collection.extend({

  comparator: function(a,b) {
    if (a.get('name') === 'Other') {
      return 1;
    } else if (b.get('name') === 'Other') {
      return -1;
    } else if (a.get('value') === b.get('value')) {
      return (a.get('selected') < b.get('selected')) ? 1 : -1;
    } else {
      return (a.get('value') < b.get('value')) ? 1 : -1;
    }
  }

});
