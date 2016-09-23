var _ = require('underscore');
var LegendBaseDefModel = require('./legend-base-definition-model');

module.exports = LegendBaseDefModel.extend({
  defaults: _.extend({}, LegendBaseDefModel.prototype.defaults,
    {
      type: 'choropleth',
      prefix: '',
      suffix: ''
    }
  ),

  toJSON: function () {
    return _.extend(
      {},
      _.omit(this.attributes, 'prefix', 'suffix'),
      {
        definition: {
          prefix: this.get('prefix'),
          suffix: this.get('suffix')
        }
      }
    );
  }
});
