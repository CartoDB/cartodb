var _ = require('underscore');
var Backbone = require('backbone');

// var REQUIRED_OPTS = [
//   'vis'
// ];

var DataviewsCollection = Backbone.Collection.extend({
  // initialize: function (models, options) {
  //   _.each(REQUIRED_OPTS, function (item) {
  //     if (options[item] === undefined) throw new Error(item + ' is required');
  //     this['_' + item] = options[item];
  //   }, this);

  //   this._tracking = false;
  //   this._initBinds();
  // },

  // track: function () {
  //   this._tracking = true;
  //   this._check();
  // },

  isAnalysisLinkedToDataview: function (analysisModel) {
    return this.any(function (dataviewModel) {
      var sourceId = dataviewModel.getSourceId();
      return analysisModel.get('id') === sourceId;
    });
  },

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

  // _initBinds: function () {
  //   this.on('change:status', this._check, this);
  // },

  // _check: function () {
  //   if (this._tracking === false) return;

  //   var allFetched = this.every(function (dataviewModel) {
  //     return dataviewModel.isUnavailable() || dataviewModel.isFetched();
  //   });

  //   if (allFetched) {
  //     this._vis.trigger('dataviewsFetched');
  //   }
  // }
});

module.exports = DataviewsCollection;
