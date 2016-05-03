var _ = require('underscore');
var cdb = require('cartodb.js');

/**
 * Base model for an analysis form model
 */
module.exports = cdb.core.Model.extend({

  schema: {},

  initialize: function (attrs, opts) {
    if (!opts.analysisDefinitionNodeModel) throw new Error('analysisDefinitionNodeModel is required');

    this._analysisDefinitionNodeModel = opts.analysisDefinitionNodeModel;

    this.bind('change', _.debounce(this._onChange.bind(this), 500));
  },

  _onChange: function () {
    this._analysisDefinitionNodeModel.set(this.changed);
  }

});
