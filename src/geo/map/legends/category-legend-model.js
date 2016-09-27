var _ = require('underscore');
var LegendModelBase = require('./legend-model-base');

var CategoryLegendModel = LegendModelBase.extend({
  defaults: function () {
    return _.extend(LegendModelBase.prototype.defaults.apply(this), {
      type: 'category'
    });
  },

  hasData: function () {
    return this.get('categories') && this.get('categories').length > 0;
  }
});

module.exports = CategoryLegendModel;
