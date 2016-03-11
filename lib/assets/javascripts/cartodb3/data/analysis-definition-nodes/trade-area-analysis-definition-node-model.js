var cdb = require('cartodb.js');

/**
 * Node for a trade area
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    type: 'trade-area'
  },

  parse: function (r) {
    var p = r.params;

    // Recover source analysis model
    this.collection.add(p.source);

    return {
      id: r.id,
      kind: p.kind,
      source_id: p.source.id,
      time: p.time
    };
  },

  initialize: function (attrs) {
    if (!this.id) {
      var sourceId = this.sourceModel().id;
      this.set('id', this.collection.nextId(sourceId));
    }
  },

  toJSON: function () {
    return {
      id: this.id,
      type: this.get('type'),
      params: {
        kind: this.get('kind'),
        time: this.get('time'),
        source: this.sourceModel().toJSON()
      }
    };
  },

  sourceModel: function () {
    return this.collection.get(this.get('source_id'));
  }

});
