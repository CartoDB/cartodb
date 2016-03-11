var _ = require('underscore');
var Backbone = require('backbone');

var TYPE_TO_MODEL_MAP = {
  'source': require('./analysis-definition-nodes/source-analysis-definition-node-model'),
  'trade-area': require('./analysis-definition-nodes/trade-area-analysis-definition-node-model')
};
var SOURCE_ID_REGEX = /^([a-zA-Z]+)(\d+)$/; // matches a string with one or more letters + numbers, e.g. 'b2'

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

  /**
   * Get next id in sequence of given source id.
   * @param {String} id e.g. 'B2'
   * @return {String} e.g. 'B3'
   */
  nextId: function (id) {
    if (!id || !id.match) throw new Error('invalid id');

    var matches = id.match(SOURCE_ID_REGEX);

    if (matches && matches.length === 3) {
      // letter + next number
      var letter = matches[1];
      var nextNumber = parseInt(matches[2], 10) + 1;
      return letter + nextNumber;
    } else {
      throw new Error('invalid id');
    }
  }

});
