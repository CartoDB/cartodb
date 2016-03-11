var _ = require('underscore');
var cdb = require('cartodb.js');

/**
 * Analysis definition model.
 * Points to a node that is the head of the particular analyzes.
 */
module.exports = cdb.core.Model.extend({

  parse: function (r) {
    this.collection.createNodeModel(r.analysis_definition);

    var attrs = _.omit(r, 'analysis_definition');
    attrs.node_id = r.analysis_definition.id;

    return attrs;
  },

  toJSON: function () {
    return {
      id: this.id,
      analysis_definition: this.collection.getNodeModel(this.get('node_id')).toJSON()
    };
  }

});
