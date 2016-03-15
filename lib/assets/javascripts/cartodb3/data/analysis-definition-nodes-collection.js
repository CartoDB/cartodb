var _ = require('underscore');
var Backbone = require('backbone');
var nodeIds = require('./analysis-definition-node-ids');
var AnalysisDefinitionNodeModel = require('./analysis-definition-node-model');

/**
 * Collection of analysis definitions nodes.
 */
module.exports = Backbone.Collection.extend({

  model: function (r, opts) {
    var self = opts.collection;

    var m = new AnalysisDefinitionNodeModel(r, {
      parse: _.isBoolean(opts.parse) ? opts.parse : true,
      collection: self
    });

    return m;
  },

  initialize: function () {
    this.ids = nodeIds;
  }

});
