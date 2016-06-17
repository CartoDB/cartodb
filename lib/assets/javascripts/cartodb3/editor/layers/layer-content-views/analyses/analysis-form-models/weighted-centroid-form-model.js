var _ = require('underscore');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./weighted-centroid-form.tpl');
var ColumnOptions = require('../column-options');

/**
 * Form model for a weighted-centroid analysis
 * It has a rather complicated schema, that depends on several data points and state.
 */
module.exports = BaseAnalysisFormModel.extend({
  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);
    this.on('change:aggregate', this._onUpdateAggregate, this);

    var nodeDefModel = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.get('source'));
    this._columnOptions = new ColumnOptions({}, {
      nodeDefModel: nodeDefModel
    });

    this.listenTo(this._columnOptions, 'columnsFetched', this._setSchema);

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
    var schema = {
      source: {
        type: 'Select',
        text: _t('editor.layers.analysis-form.source'),
        options: [ this.get('source') ],
        editorAttrs: { disabled: true }
      },
      category_column: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.category-column'),
        options: this._columnOptions.all()
      },
      weight_column: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.weight-column'),
        options: this._columnOptions.filterByType('number')
      },
      aggregate: {
        type: 'Enabler',
        title: _t('editor.layers.analysis-form.aggregate')
      }
    };

    if (this.get('aggregate')) {
      schema = _.extend(schema, {
        aggregate_column: {
          type: 'Select',
          title: _t('editor.layers.analysis-form.column'),
          options: this._columnOptions.all()
        },
        aggregate_operation: {
          type: 'Select',
          title: _t('editor.layers.analysis-form.operation'),
          options: ['sum', 'avg', 'min', 'max'],
          validators: ['required']
        }
      });
    }
    BaseAnalysisFormModel.prototype._setSchema.call(this, schema);
  },

  _onUpdateAggregate: function () {
    if (!this.get('aggregate')) {
      this.unset('aggregate_column', { silent: true });
      this.set('aggregate_operation', 'count');
    } else {
      this.unset('aggregate_operation');
    }
    this._setSchema();
  }
});
