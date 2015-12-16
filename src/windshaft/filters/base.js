var cdb = require('cartodb.js');

module.exports = cdb.core.Model.extend({
  isEmpty: function () {
    throw new Error('Filters must implement the .isEmpty method');
  },

  toJSON: function () {
    throw new Error('Filters must implement the .toJSON method');
  }
});
