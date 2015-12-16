var cdb = require('cartodb.js')

/**
 *
 */

module.exports = cdb.core.Model.extend({
  defaults: {
    name: '',
    agg: false,
    value: 0
  }

})
