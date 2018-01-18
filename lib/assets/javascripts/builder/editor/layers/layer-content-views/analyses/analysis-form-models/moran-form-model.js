var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./moran-form.tpl');
var ColumnOptions = require('builder/editor/layers/layer-content-views/analyses/column-options');

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

    this._columnOptions = new ColumnOptions({}, {
      configModel: this._configModel,
      nodeDefModel: this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.get('source'))
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
      source: this._primarySourceSchemaItem(),
      numerator_column: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.numerator'),
        placeholder: _t('editor.layers.analysis-form.select-column'),
        options: this._columnOptions.filterByType('number'),
        dialogMode: 'float',
        help: _t('editor.layers.analysis-form.numerator-help')
      },
      denominator_column: {
        type: 'EnablerEditor',
        title: '',
        label: _t('editor.layers.analysis-form.normalize'),
        help: _t('editor.layers.analysis-form.normalize-help'),
        editor: {
          type: 'Select',
          title: _t('editor.layers.analysis-form.normalize'),
          placeholder: _t('editor.layers.analysis-form.select-column'),
          options: this._columnOptions.filterByType('number'),
          dialogMode: 'float',
          disabledPlaceholder: _t('editor.layers.analysis-form.enable-normalize')
        }
      },
      significance: {
        type: 'Number',
        title: _t('editor.layers.analysis-form.significance'),
        help: _t('editor.layers.analysis-form.significance-help'),
        validators: ['required', {
          type: 'interval',
          min: 0,
          max: 1,
          step: 0.05
        }]
      },
      neighbours: {
        type: 'Number',
        title: _t('editor.layers.analysis-form.neighbors'),
        help: _t('editor.layers.analysis-form.neighbors-help'),
        validators: ['required', {
          type: 'interval',
          min: 1,
          max: 100
        }]
      }
      // hidden as per https://github.com/CartoDB/cartodb/pull/7893#issuecomment-226803659
      /*
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
      */
    };
    BaseAnalysisFormModel.prototype._setSchema.call(this, schema);
  },

  updateNodeDefinition: function (nodeDefModel) {
    var nodeAttrs = this._formatAttrs(this.attributes);
    // It could happen that denominator_column is not present, and if we use `set`
    // instead of the thing below, it could keep returning that attribute for the analysis
    nodeDefModel.attributes = nodeAttrs;
  }
});
