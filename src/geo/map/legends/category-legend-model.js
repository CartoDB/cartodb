var DynamicLegendModelBase = require('./dynamic-legend-model-base');

var CategoryLegendModel = DynamicLegendModelBase.extend({
  TYPE: 'category',

  hasData: function () {
    return this.get('categories') && this.get('categories').length > 0;
  }
});

module.exports = CategoryLegendModel;
