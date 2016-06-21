var _ = require('underscore');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var intersectionTemplate = require('./intersection-form.tpl');
var aggregateTemplate = require('./intersection-aggregate-form.tpl');
var ColumnOptions = require('../column-options');

/**
 * Form model for the intersection analysis
 */
module.exports = BaseAnalysisFormModel.extend({
  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    var nodeDefModel = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.get('source'));

    this._columnOptions = new ColumnOptions({}, {
      nodeDefModel: nodeDefModel
    });

    this.listenTo(this._columnOptions, 'columnsFetched', this._setSchema);

    this.on('change:type', this._setSchema, this);

    this._setSchema();
  },

  getTemplate: function () {
    if (this.get('type') === 'aggregate-intersection') {
      return aggregateTemplate;
    } else {
      return intersectionTemplate;
    }
  },

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
      target: {
        type: 'Select',
        text: _t('editor.layers.analysis-form.source'),
        options: this._getTargetNodes()
      },
      type: {
        type: 'Radio',
        text: _t('editor.layers.analysis-form.source'),
        options: [
          { label: 'Filter', val: 'intersection' },
          { label: 'Aggregate', val: 'aggregate-intersection' }
        ]
      }
    };

    if (this.get('type') === 'aggregate-intersection') {
      schema = _.extend(schema, {
        aggregate_column: {
          type: 'Select',
          title: _t('editor.layers.analysis-form.column'),
          options: this._columnOptions.all(),
          validators: ['required']
        },
        aggregate_function: {
          type: 'Select',
          title: _t('editor.layers.analysis-form.operation'),
          options: ['sum', 'avg', 'min', 'max'],
          validators: ['required']
        }
      });
    }

    BaseAnalysisFormModel.prototype._setSchema.call(this, schema);
  },

  _getTargetNodes: function () {
    return _.chain(this._layerDefinitionModel.collection.pluck('source'))
    .compact()
    .without(this.get('source'))
    .sort()
    .value();
  }
});
