var _ = require('underscore');
var Backbone = require('backbone');
var nodeIds = require('./analysis-definition-node-ids');

var TYPE_TO_MODEL_MAP = {
  'estimated-population': require('./analysis-definition-nodes/estimated-population-analysis-definition-node-model'),
  'source': require('./analysis-definition-nodes/source-analysis-definition-node-model'),
  'routing-n-to-n': require('./analysis-definition-nodes/routing-n-to-n-analysis-definition-node-model'),
  'total-population': require('./analysis-definition-nodes/total-population-analysis-definition-node-model'),
  'trade-area': require('./analysis-definition-nodes/trade-area-analysis-definition-node-model')
};

/**
 * Collection of analysis definitions
 */
module.exports = Backbone.Collection.extend({

  model: function (d, opts) {
    var self = opts.collection;

    var Klass = TYPE_TO_MODEL_MAP[d.type];
    if (!Klass) throw new Error('no analysis-definition-node model found for type ' + d.type);

    var m = new Klass(d, {
      parse: _.isBoolean(opts.parse)
        ? opts.parse
        : true,
      collection: self
    });

    return m;
  },

  initialize: function () {
    this.ids = nodeIds;
  }

});
