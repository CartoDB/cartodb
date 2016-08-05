var _ = require('underscore');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./convex-hull.tpl');
var ColumnOptions = require('../column-options');

/**
 * Form model for a convex hull analysis
 */
module.exports = BaseAnalysisFormModel.extend({
  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    this._columnOptions = new ColumnOptions({}, {
      configModel: this._configModel,
      nodeDefModel: this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.get('source'))
    });

    this.listenTo(this._columnOptions, 'columnsFetched', this._setSchema);

    this.on('change:type', this._setSchema, this);

    this._setSchema();
  },

  getTemplate: function () {
    return template;
  },

  getTemplateData: function () {
    return {
      parametersDataFields: ['source', 'category_column']
    };
  },

  _filterSchemaFieldsByType: function (schema) {
    // Always include the source and target fields in addition to the type-specific fields
    return _.pick(schema, ['source', 'category_column']);
  },

  /**
   * @override {BaseAnalysisFormModel._setSchema}
   */
  _setSchema: function () {
    BaseAnalysisFormModel.prototype._setSchema.call(this, this._filterSchemaFieldsByType({
      source: this._primarySourceSchemaItem(),
      category_column: {
        type: 'EnablerEditor',
        title: '',
        label: _t('editor.layers.analysis-form.group-by'),
        editor: {
          type: 'Select',
          options: this._columnOptions.all(),
          editorAttrs: {
            showLabel: false
          }
        }
      }
    }));
  }
});
