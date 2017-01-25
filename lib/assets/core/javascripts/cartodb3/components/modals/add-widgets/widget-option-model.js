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

  save: function () {
    throw new Error('save should be implemented by child');
  },

  _selectedItem: function () {
    var i = this.get('layer_index') || 0;
    var tuples = this.get('tuples') || [];
    return tuples[i] || {};
  }

});
