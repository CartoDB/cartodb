var _ = require('underscore');
var Backbone = require('backbone');

var DataviewsCollection = Backbone.Collection.extend({
  isAnyDataviewFiltered: function () {
    return this.any(function (dataviewModel) {
      var filter = dataviewModel.filter;
      return (filter && !filter.isEmpty());
    });
  },

  getFilters: function () {
    return this.reduce(function (filters, dataviewModel) {
      var filter = dataviewModel.filter;
      if (filter && !filter.isEmpty()) {
        filters['dataviews'] = filters['dataviews'] || {};
        _.extend(filters['dataviews'], filter.toJSON());
      }
      return filters;
    }, {});
  }
});

module.exports = DataviewsCollection;
