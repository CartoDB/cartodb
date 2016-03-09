var _ = require('underscore');
var cdb = require('cartodb.js');

var OWN_ATTRS_NAMES = ['id', 'type'];

/**
 * Analysis definition of a trade area.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    type: 'trade-area',
    source: null,
    kind: 'walk',
    time: 300 // seconds?
  },

  parse: function (r) {
    // Flatten attributes
    return _.defaults(
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
