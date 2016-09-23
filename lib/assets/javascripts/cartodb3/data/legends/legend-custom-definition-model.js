var _ = require('underscore');
var LegendBaseDefModel = require('./legend-base-definition-model');

module.exports = LegendBaseDefModel.extend({
  defaults: _.extend({}, LegendBaseDefModel.prototype.defaults,
    {
      type: 'custom',
      items: []
    }
  ),

  toJSON: function () {
    return _.extend(
      {},
      _.omit(this.attributes, 'items'),
      {
        definition: {
          categories: this.get('items').map(function (item) {
            return {
              title: item.name,
              color: item.color
            };
          })
        }
      }
    );
  }
});
