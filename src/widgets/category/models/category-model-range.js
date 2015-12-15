var _ = require('underscore')
var cdb = require('cartodb.js')

/**
 *  This model is used for getting the total amount of values
 *  from the category.
 *
 */

module.exports = cdb.core.Model.extend({
  defaults: {
    url: '',
    totalCount: 0
  },

  url: function () {
    return this.get('url')
  },

  initialize: function () {
    this.bind('change:url', function () {
      this.fetch()
    }, this)
  },

  setUrl: function (url) {
    this.set('url', url)
  },

  parse: function (d) {
    // Calculating the total amount of all categories with the sum of all
    // values from this model included the aggregated (Other)

    return {
      totalCount: _.reduce(
        _.pluck(d.categories, 'value'),
        function (memo, value) {
          return memo + value
        },
        0
      )
    }
  }
})
