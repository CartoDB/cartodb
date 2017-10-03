var _ = require('underscore');
var LegendBaseDefModel = require('./legend-custom-definition-model');

module.exports = LegendBaseDefModel.extend({
  defaults: function () {
    return _.extend({}, LegendBaseDefModel.prototype.defaults,
      {
        type: 'torque',
        items: [],
        html: ''
      }
    );
  },

  parse: function (r, opts) {
    var attrs = LegendBaseDefModel.prototype.parse.call(this, r, opts);
    attrs.type = 'torque';
    return attrs;
  }
});
