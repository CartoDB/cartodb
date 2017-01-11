var Backbone = require('backbone');
var CategoryItemModel = require('./category-item-model');

/**
 *  Data categories collection
 *
 *  - It basically sorts by (value, selected and "Other").
 */

module.exports = Backbone.Collection.extend({
  model: CategoryItemModel,

  initialize: function (models, options) {
    this.aggregationModel = options.aggregationModel;
    this.aggregation = options.aggregationModel.get('aggregation');
    this.aggregationModel.on('change:aggregation', function (model, aggregation) {
      this.aggregation = aggregation;
      this.filterNull();
    }, this);

    this.on('reset', this.filterNull, this);
  },

  filterNull: function () {
    if (this.aggregation === 'count') return;

    var models = this.filter(function (category) {
      return category.get('value') != null;
    });

    this.reset(models, {silent: true});
  },

  comparator: function (a, b) {
    if (a.get('name') === 'Other') {
      return 1;
    } else if (b.get('name') === 'Other') {
      return -1;
    } else if (a.get('value') === b.get('value')) {
      return (a.get('selected') < b.get('selected')) ? 1 : -1;
    } else {
      return (a.get('value') < b.get('value')) ? 1 : -1;
    }
  },

  isOtherAvailable: function () {
    return this.where({
      agg: true,
      name: 'Other'
    }).length > 0;
  }

});
