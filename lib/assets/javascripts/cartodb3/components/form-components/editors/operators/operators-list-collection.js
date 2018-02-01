var CustomListCollection = require('../../../custom-list/custom-list-collection');
var _ = require('underscore');

/*
 *  Custom list collection, it parses pairs like:
 *
 *  [{ val, label }]
 *  ["string"]
 */

module.exports = CustomListCollection.extend({

  search: function (query) {
    query = query.toLowerCase();

    return _(this.filter(function (model) {
      var val = model.getName().toLowerCase();
      var type = model.get('type').toLowerCase();
      return ~val.indexOf(query) && type === 'number';
    }));
  }

});
