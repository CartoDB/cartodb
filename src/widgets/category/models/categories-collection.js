var cdb = require('cartodb.js');
var CategoryItemModel = require('./category-item-model');

/**
 *  Data categories collection
 *
 *  - It basically sorts by (value, selected and "Other").
 */

module.exports = cdb.Backbone.Collection.extend({
  model: CategoryItemModel,

  comparator: function (a, b) {
    if (a.get('name') === 'Other') {
      return 1;
    } else if (b.get('name') === 'Other') {
      return -1;
    } else if (a.get('value') === b.get('value')) {
      return (a.get('selected') < b.get('selected')) ? 1 : -1;
    } else {
      return (a.get('value') < b.get('value')) ? 1 : -1;
    }
  },

  isOtherAvailable: function () {
    return this.where({
      agg: true,
      name: 'Other'
    }).length > 0;
  }

});
