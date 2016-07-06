var _ = require('underscore');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./centroid-form.tpl');
var ColumnOptions = require('../column-options');

var FORMAT_FIELD_NAMES = 'category_column,aggregation,aggregation_column,weight_column';
var WEIGHT_CENTROID_FIELDS = 'category,category_column,aggregate,aggregate_column_operator,weight,weight_column';
var CENTROID_FIELDS = 'category,category_column,aggregate,aggregate_column_operator,weight';

/**
 * Form model for a centroid and weighted-centroid analysis
 * It has a rather complicated schema, that depends on several data points and state.
 */
module.exports = BaseAnalysisFormModel.extend({
  parse: function (attrs) {
    return _.extend(attrs, {
      category: !!attrs.category_column,
      weight: !!attrs.weight_column,
      aggregate: !!attrs.aggregation_column || !!attrs.aggregation,
      aggregate_column_operator: {
        operator: attrs.aggregation || 'count',
        attribute: attrs.aggregation === 'count' ? '' : attrs.aggregation_column
      }
    });
  },

  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    this._columnOptions = new ColumnOptions({}, {
      configModel: this._configModel,
      nodeDefModel: this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.get('source'))
    });

    this.listenTo(this._columnOptions, 'columnsFetched', this._setSchema);

    this.on('change:category', this._onChangeCategory, this);
    this.on('change:aggregate_column_operator', this._onChangeAggregateOperator, this);
    this.on('change:aggregate', this._onChangeAggregate, this);
    this.on('change:weight', this._onChangeWeight, this);
    this.on('change:type', this._setSchema, this);

    this._setSchema();
  },

  updateNodeDefinition: function (nodeDefModel) {
    var attrs = this._formatAttrs(this.attributes);
    nodeDefModel.clear({silent: true});
    nodeDefModel.set(attrs);
  },

  _getFormatFieldNames: function () {
    var fields = FORMAT_FIELD_NAMES.split(',');

    if (!this.get('aggregate')) {
      fields = _.difference(fields, ['aggregation', 'aggregation_column']);
    }
    if (!this.get('weight')) {
      fields = _.without(fields, 'weight_column');
    }
    if (!this.get('category')) {
      fields = _.without(fields, 'category_column');
    }

    return fields.join(',');
  },

  _formatAttrs: function (formAttrs) {
    var customFormattedFormAttrs = _.pick(formAttrs, ['id', 'source', 'type'].concat(this._getFormatFieldNames().split(',')));

    return BaseAnalysisFormModel.prototype._formatAttrs.call(this, customFormattedFormAttrs);
  },

  getTemplate: function () {
    return template;
  },

  getTemplateData: function () {
    return {
      parametersDataFields: this._getFormFieldNames()
    };
  },

  _getFormFieldNames: function () {
    var fields = this.get('type') === 'centroid' ? CENTROID_FIELDS.split(',') : WEIGHT_CENTROID_FIELDS.split(',');

    if (!this.get('aggregate')) {
      fields = _.without(fields, 'aggregate_column_operator');
    }
    if (!this.get('weight')) {
      fields = _.without(fields, 'weight_column');
    }
    if (!this.get('category')) {
      fields = _.without(fields, 'category_column');
    }

    return fields.join(',');
  },

  _filterSchemaFieldsByType: function (schema) { // Always include the source and target fields in addition to the type-specific fields
    return _.pick(schema, ['source'].concat(this._getFormFieldNames().split(',')));
  },

  /*
  /**
   * @override {BaseAnalysisFormModel._setSchema}
   */
  _setSchema: function () {
    BaseAnalysisFormModel.prototype._setSchema.call(this, this._filterSchemaFieldsByType({
      source: {
        type: 'Select',
        text: _t('editor.layers.analysis-form.source'),
        options: [ this.get('source') ],
        editorAttrs: { disabled: true }
      },
      category: {
        type: 'Enabler',
        title: _t('editor.layers.analysis-form.categorize-by')
      },
      category_column: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.column'),
        options: this._columnOptions.all()
      },
      weight: {
        type: 'Enabler',
        title: _t('editor.layers.analysis-form.weighted-by')
      },
      weight_column: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.column'),
        options: this._columnOptions.filterByType('number'),
        validators: ['required']
      },
      aggregate: {
        type: 'Enabler',
        title: _t('editor.layers.analysis-form.aggregate-by')
      },
      aggregate_column_operator: {
        type: 'Operators',
        title: _t('editor.layers.analysis-form.column'),
        options: this._columnOptions.filterByType('number')
      }
    }));
  },

  _onChangeWeight: function () {
    if (this.get('weight')) {
      this.set('type', 'weighted-centroid');
    } else {
      this.unset('weight_column');
      this.set('type', 'centroid');
    }
    this._setSchema();
  },

  _onChangeCategory: function () {
    if (!this.get('category')) {
      this.unset('category_column');
    }
    this._setSchema();
  },

  _onChangeAggregateOperator: function () {
    var aggregate = this.get('aggregate_column_operator');

    this.set({
      aggregation_column: aggregate.attribute,
      aggregation: aggregate.operator
    });
  },

  _onChangeAggregate: function () {
    if (!this.get('aggregate')) {
      this.set('aggregate_column_operator', {
        operator: 'count',
        attribute: ''
      });
    }
    this._setSchema();
  }
});
