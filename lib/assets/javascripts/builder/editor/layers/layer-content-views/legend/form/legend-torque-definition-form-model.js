var _ = require('underscore');
var LegendBaseDefModel = require('./legend-category-definition-form-model');

module.exports = LegendBaseDefModel.extend({
  defaults: _.extend({}, LegendBaseDefModel.prototype.defaults,
    {
      type: 'torque'
    }
  )
});
