var MosaicCollection = require('../../../components/mosaic/mosaic-collection');
var BasemapModel = require('./basemap-model');
var _ = require('underscore');

/*
 *  Basemap collection, extends Mosaic collection
 */

module.exports = MosaicCollection.extend({

  model: BasemapModel,

  findByCategory: function (cat) {
    var filtered = this.filter(function (m) {
      return m.get('category') === cat;
    });

    return filtered;
  },

  getDefaultCategory: function () {
    var defaultCategory = _.first(this.where({ default: true }));

    if (defaultCategory === undefined) {
      defaultCategory = this.first();
    }

    return defaultCategory.get('category');
  },

  getCategories: function () {
    var categories = [];

    this.filter(function (mdl) {
      var s = mdl.get('category');

      if (!_.contains(categories, s)) {
        categories.push(s);
      }
    });

    if (!_.contains(categories, 'Custom')) {
      categories.push('Custom');
    }

    if (!_.contains(categories, 'Mapbox')) {
      categories.push('Mapbox');
    }

    return categories;
  },

  getByUserLayerId: function (id) {
    return _.first(this.where({ userLayer: id }));
  }

});
