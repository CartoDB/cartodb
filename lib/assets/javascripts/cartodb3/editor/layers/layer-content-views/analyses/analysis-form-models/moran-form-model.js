var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./moran-form.tpl');
var ColumnOptions = require('../column-options');

/**
 * Form model for a moran analysis
 * It has a rather complicated schema, that depends on several data points and state.
 */
module.exports = BaseAnalysisFormModel.extend({
  defaults: {
    significance: 0.05,
    neighbours: 5,
    permutations: 99,
    w_type: 'knn'
  },

  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

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
      numerator_column: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.numerator'),
        options: this._columnOptions.all()
      },
      denominator_column: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.denominator'),
        options: this._columnOptions.all()
      },
      significance: {
        type: 'Number',
        title: _t('editor.layers.analysis-form.significance'),
        validators: ['required', {
          type: 'interval',
          min: 0,
          max: 1,
          step: 0.05
        }]
      },
      neighbours: {
        type: 'Number',
        title: _t('editor.layers.analysis-form.neighbours'),
        validators: ['required', {
          type: 'interval',
          min: 1,
          max: 100
        }]
      },
      permutations: {
        type: 'Number',
        title: _t('editor.layers.analysis-form.permutations'),
        validators: ['required', {
          type: 'interval',
          min: 1,
          max: 100
        }]
      },
      w_type: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.weight-type'),
        options: ['knn', 'queen'],
        validators: []
      }
    };
    BaseAnalysisFormModel.prototype._setSchema.call(this, schema);
  }
});
