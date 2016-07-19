var Backbone = require('backbone');
var BasemapModel = require('./basemap-model');
var _ = require('underscore');

/*
 *  Basemap collection
 *
 *  it works as a mosaic collection, too
 */

module.exports = Backbone.Collection.extend({

  model: BasemapModel,

  initialize: function () {
    this._initBinds();
  },

  _initBinds: function () {
    this.bind('change:selected', this._onSelectedChange, this);
  },

  _onSelectedChange: function (changedModel, isSelected) {
    if (isSelected) {
      this.each(function (m) {
        if (m.cid !== changedModel.cid && m.get('selected')) {
          m.set('selected', false);
        }
      });
    }
  },

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

  getSelected: function () {
    return _.first(this.where({ selected: true }));
  },

  getHighlighted: function () {
    return _.first(this.where({ highlighted: true }));
  }

});
