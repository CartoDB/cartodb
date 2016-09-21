var _ = require('underscore');
var LegendBaseDefModel = require('./legend-base-definition-model');

module.exports = LegendBaseDefModel.extend({
  defaults: _.extend({}, LegendBaseDefModel.prototype.defaults,
    {
      type: 'bubble',
      fillColor: '#fabada'
    }
  ),

  parse: function (r, opts) {
    var attrs = _.extend({}, r);
    if (r.definition) {
      attrs.fillColor = r.definition.color;
    }
    return attrs;
  },

  toJSON: function () {
    return _.extend(
      {},
      _.omit(this.attributes, 'fill', 'fillColor'),
      {
        definition: {
          color: this.get('fillColor')
        }
      }
    );
  }
});
