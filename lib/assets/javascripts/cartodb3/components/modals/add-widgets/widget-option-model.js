var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

  defaults: {
    layer_index: 0,
    tuples: []
  },

  analysisDefinitionNodeModel: function () {
    return this._selectedItem().analysisDefinitionNodeModel;
  },

  layerDefinitionModel: function () {
    return this._selectedItem().layerDefinitionModel;
  },

  columnName: function () {
    return this._selectedItem().columnModel.get('name');
  },

  save: function (attrs, opts) {
    if (!opts.analysisDefinitionsCollection) throw new Error('analysisDefinitionsCollection is required');
    if (!opts.widgetDefinitionsCollection) throw new Error('analysisDefinitionsCollection is required');

    var nodeDefModel = this.analysisDefinitionNodeModel();

    // Might not always have a node-definition, e.g. time-series none-option
    if (nodeDefModel) {
      var analysisDefinitionModel = opts.analysisDefinitionsCollection.findAnalysisThatContainsNode(nodeDefModel);

      if (!analysisDefinitionModel) {
        opts.analysisDefinitionsCollection.create({analysis_definition: nodeDefModel.toJSON()});
        this.layerDefinitionModel().save();
      }
    }

    this._createUpdateOrSimilar(opts.widgetDefinitionsCollection);
  },

  _createUpdateOrSimilar: function () {
    throw new Error('_createUpdateOrSimilar should be implemented by child');
  },

  _selectedItem: function () {
    var i = this.get('layer_index') || 0;
    var tuples = this.get('tuples') || [];
    return tuples[i] || {};
  }

});
