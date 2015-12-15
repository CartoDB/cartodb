var Model = require('cartodb.js').core.Model

module.exports = Model.extend({
  isEmpty: function () {
    throw new Error('Filters must implement the .isEmpty method')
  },

  toJSON: function () {
    throw new Error('Filters must implement the .toJSON method')
  }
})
