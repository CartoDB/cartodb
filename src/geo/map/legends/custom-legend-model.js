var _ = require('underscore');
var StaticLegendModelBase = require('./static-legend-model-base');

var CustomLegendModel = StaticLegendModelBase.extend({
  defaults: function () {
    return _.extend(StaticLegendModelBase.prototype.defaults.apply(this), {
      type: 'custom',
      items: []
    });
  },

  parse: function (r, opts) {
    var attrs = _.extend({},
      _.omit(r, 'items')
    );
    attrs.items = [];

    if (r.items) {
      attrs.items = r.items.map(function (item) {
        return {
          name: item.title,
          color: item.color
        };
      });
    }

    return attrs;
  }
});

module.exports = CustomLegendModel;
