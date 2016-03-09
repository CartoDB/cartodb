var Backbone = require('backbone');

var TYPE_TO_ANALYSIS_DEFINITION_MODEL_MAP = {
  'source': require('./analysis-definitions/analysis-source-definition-model'),
  'trade-area': require('./analysis-definitions/analysis-trade-area-definition-model')
};
var SOURCE_ID_REGEX = /^([a-zA-Z]+)(\d+)$/;

/**
 * Collection of analysis definitions
 */
module.exports = Backbone.Collection.extend({

  model: function (d, opts) {
    var self = opts.collection;
    var Klass = TYPE_TO_ANALYSIS_DEFINITION_MODEL_MAP[d.type];
    if (!Klass) throw new Error('no analysis definition class found for type ' + d.type);
    var m = new Klass(d, {
      parse: true, // make sure data is structured as expected
      collection: self,
      configModel: self._configModel
    });

    return m;
  },

  initialize: function (models, options) {
    if (!options.configModel) throw new Error('configModel is required');

    this._configModel = options.configModel;
  },

  /**
   * Get next id in sequence of given source id.
   * @param {String} sourceId e.g. 'B2'
   * @return {String} e.g. 'B3'
   */
  nextId: function (sourceId) {
    if (!sourceId || !sourceId.match) throw new Error('invalid sourceId');
    var matches = sourceId.match(SOURCE_ID_REGEX);
    if (!matches || matches.length < 3) throw new Error('invalid sourceId');

    var letters = matches[1];
    var nextNumber = parseInt(matches[2], 10) + 1;

    return letters + nextNumber;
  }

});
