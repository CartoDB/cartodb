var _ = require('underscore');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./weighted-centroid-form.tpl');

/**
 * Form model for a weighted-centroid analysis
 * It has a rather complicated schema, that depends on several data points and state.
 */
module.exports = BaseAnalysisFormModel.extend({
  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);
    this.on('change:aggregate', this._onUpdateAggregate, this);
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
      weight_column: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.weight-column'),
        options: this._getColumnsByType('number')
      },
      category_column: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.category-column'),
        options: this._getColumnsByType()
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
          options: this._getColumnsByType()
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
    }
    this._setSchema();
  }
});
