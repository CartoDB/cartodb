var Backbone = require('backbone');
var _ = require('underscore');
var CategoryItemModel = require('./category-item-model');
var COUNT_AGGREGATION_TYPE = 'count';

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
  },

  reset: function (models, options) {
    if (this.aggregationModel.get('aggregation') !== COUNT_AGGREGATION_TYPE) {
      models = _.filter(models, function (category) {
        var isModel = category instanceof Backbone.Model;
        var value = isModel ? category.get('value') : category.value;
        return value != null;
      });
    }
    Backbone.Collection.prototype.reset.call(this, models, options);
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
