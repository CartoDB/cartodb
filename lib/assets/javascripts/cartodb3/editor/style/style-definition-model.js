var cdb = require('cartodb.js');
var WizardsFactory = require('./wizards-factory');

module.exports = cdb.core.Model.extend({

  defaults: {
    type: 'simple'
  },

  /*
    type: 'simple', 'aggregation', 'heatmap',
    aggregation: { -> Aggregation options model
      type: 'hexabins',
      table: <%- tableName %>,
      value: "COUNT", "MAX(<%= columnName %>)",...
      resolution: 1..30 ?
    },
    properties: { -> Wizards form model
      the-component: {
        image: http://..,
      },
      stroke: ...,
      animated: true
    }
  */

  initialize: function (attrs, opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.layerTableModel) throw new Error('layerTableModel is required');

    if (!attrs) {
      this._setDefaultProperties();
    }

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._layerTableModel = opts.layerTableModel;
    this._initBinds();
  },

  _initBinds: function () {
    this.bind('change:type', this._setDefaultProperties, this);
    this._layerDefinitionModel.bind('change:sql', function () {}, this);
    this._layerTableModel.bind('change:geometry_types', function () {}, this);
    this._layerTableModel.columnsCollection.bind('change', function () {}, this);
  },

  _setDefaultProperties: function () {
    // Get default aggregation and properties from factory and apply them
  }
});
