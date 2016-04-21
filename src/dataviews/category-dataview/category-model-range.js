var _ = require('underscore');
var Model = require('../../core/model');

/**
 *  This model is used for getting the total amount of values
 *  from the category.
 *
 */

module.exports = Model.extend({
  defaults: {
    url: '',
    totalCount: 0,
    categoriesCount: 0
  },

  url: function () {
    var url = this.get('url');
    if (this.get('apiKey')) {
      url += '?api_key=' + this.get('apiKey');
    }
    return url;
  },

  initialize: function () {
    this.bind('change:url', function () {
      this.fetch();
    }, this);
  },

  setUrl: function (url) {
    this.set('url', url);
  },

  parse: function (d) {
    // Calculating the total amount of all categories with the sum of all
    // values from this model included the aggregated (Other)
    return {
      categoriesCount: d.categoriesCount,
      totalCount: _.reduce(
        _.pluck(d.categories, 'value'),
        function (memo, value) {
          return memo + value;
        },
        0
      )
    };
  }
});
