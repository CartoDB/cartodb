var Model = require('cartodb.js').core.Model

/**
 *
 */

module.exports = Model.extend({
  defaults: {
    name: '',
    agg: false,
    value: 0
  }

})
