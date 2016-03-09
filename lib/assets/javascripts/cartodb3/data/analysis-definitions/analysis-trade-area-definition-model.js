var _ = require('underscore');
var AnalysisDefinitionModel = require('./analysis-definition-model');

var OWN_ATTRS_NAMES = ['id', 'type'];

/**
 * Analysis definition of a trade area.
 */
module.exports = AnalysisDefinitionModel.extend({

  defaults: {
    type: 'trade-area',
    source: null,
    kind: 'walk',
    time: 300 // seconds?
  },

  parse: function (r) {
    // Recover source analysis model
    var sourceData = r.params.source;
    this.collection.add(sourceData);

    // Flatten attributes
    return _.defaults(
      { source: sourceData.id },
      _.pick(r, OWN_ATTRS_NAMES),
      r.params
    );
  },

  toJSON: function () {
    // Unflatten
    return _.defaults(
      _.pick(this.attributes, OWN_ATTRS_NAMES),
      {
        params: {
          kind: this.get('kind'),
          time: this.get('time'),
          source: this.collection.get(this.get('source')).toJSON()
        }
      }
    );
  }

});
