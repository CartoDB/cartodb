var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./weighted-centroid-form.tpl');

/**
 * Form model for a weighted-centroid analysis
 * It has a rather complicated schema, that depends on several data points and state.
 */
module.exports = BaseAnalysisFormModel.extend({
  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);
    this._setSchema();
  },

  getTemplate: function () {
    return template;
  },

  /*
  /**
   * @override {BaseAnalysisFormModel._setSchema}
   */
  _setSchema: function () {
    BaseAnalysisFormModel.prototype._setSchema.call(this, {
      source: {
        type: 'Select',
        text: _t('editor.layers.analysis-form.source'),
        options: [ this.get('source') ],
        editorAttrs: { disabled: true }
      },
      weight_column: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.weight-column'),
        options: this._getColumns()
      },
      category_column: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.category-column'),
        options: this._getColumns()
      },
      aggregate: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.aggregate'),
        options: ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX']
      }
    });
  },

  _getColumns: function () {
    var nodeDefModel = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.get('source'));
    var querySchemaModel = nodeDefModel.querySchemaModel;

    var sourceColumns = querySchemaModel.columnsCollection.map(function (columnModel) {
      var columnName = columnModel.get('name');

      return {
        val: columnName,
        label: columnName,
        type: columnModel.get('type')
      };
    });

    return sourceColumns;
  }
});
