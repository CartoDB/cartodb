var _ = require('underscore');
var LegendBaseDefModel = require('./legend-choropleth-definition-form-model');

module.exports = LegendBaseDefModel.extend({
  defaults: _.extend({}, LegendBaseDefModel.prototype.defaults,
    {
      type: 'custom_choropleth'
    }
  )
});
