var _ = require('underscore');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./centroid-form.tpl');
var ColumnOptions = require('../column-options');

// var FORMAT_FIELD_NAMES = 'category_column,aggregation,aggregation_column,weight_column';
// var WEIGHT_CENTROID_FIELDS = 'category,category_column,aggregate,aggregate_column_operator,weight,weight_column';
// var CENTROID_FIELDS = 'category,category_column,aggregate,aggregate_column_operator,weight';

var FORMAT_FIELD_NAMES = 'category_column,aggregation,aggregation_column,weight_column';
var FIELDS = 'category,aggregate,weight';

/**
 * Form model for a centroid and weighted-centroid analysis
 * It has a rather complicated schema, that depends on several data points and state.
 */
module.exports = BaseAnalysisFormModel.extend({
  parse: function (attrs) {
    return _.extend(attrs, {
      category: attrs.category_column || '',
      weight: attrs.weight_column || '',
      aggregate: !!attrs.aggregation_column || !!attrs.aggregation || '',
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
    // nodeDefModel.set(attrs);
    nodeDefModel.attributes = attrs;
  },

  _getFormatFieldNames: function () {
    var fields = FORMAT_FIELD_NAMES.split(',');

    if (this.get('aggregate') === '') {
      fields = _.difference(fields, ['aggregation', 'aggregation_column']);
    }
    // if (this.get('weight') === '') {
    //   fields = _.without(fields, 'weight');
    // }
    // if (this.get('category') === '') {
    //   fields = _.without(fields, 'category');
    // }

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
      parametersDataFields: FIELDS // this._getFormFieldNames()
    };
  },

  // _getFormFieldNames: function () {
  //   var fields = this.get('type') === 'centroid' ? CENTROID_FIELDS.split(',') : WEIGHT_CENTROID_FIELDS.split(',');

  //   if (!this.get('aggregate')) {
  //     fields = _.without(fields, 'aggregate_column_operator');
  //   }
  //   if (!this.get('weight')) {
  //     fields = _.without(fields, 'weight_column');
  //   }
  //   if (!this.get('category')) {
  //     fields = _.without(fields, 'category_column');
  //   }
  //   return fields.join(',');
  // },

  // _filterSchemaFieldsByType: function (schema) { // Always include the source and target fields in addition to the type-specific fields
  //   return _.pick(schema, ['source'].concat(this._getFormFieldNames().split(',')));
  // },

  /*
  /**
   * @override {BaseAnalysisFormModel._setSchema}
   */
  _setSchema: function () {
    BaseAnalysisFormModel.prototype._setSchema.call(this, {
      source: this._primarySourceSchemaItem(),

      category: {
        type: 'EnablerEditor',
        title: '',
        label: _t('editor.layers.analysis-form.categorize-by'),
        help: _t('editor.layers.analysis-form.categorize-by-help'),
        editor: {
          type: 'Select',
          options: this._columnOptions.all(),
          label: _t('editor.layers.analysis-form.column')
        }
      },

      weight: {
        type: 'EnablerEditor',
        title: '',
        label: _t('editor.layers.analysis-form.weighted-by'),
        help: _t('editor.layers.analysis-form.weighted-by-help'),
        validators: ['required'],
        editor: {
          type: 'Select',
          options: this._columnOptions.filterByType('number'),
          label: _t('editor.layers.analysis-form.column')
        }
      },

      aggregate: {
        type: 'EnablerEditor',
        title: '',
        label: _t('editor.layers.analysis-form.aggregate-by'),
        help: _t('editor.layers.analysis-form.aggregate-by-help'),
        defaultValue: this.get('aggregate_column_operator'),
        editor: {
          type: 'Operators',
          options: this._columnOptions.filterByType('number'),
          label: _t('editor.layers.analysis-form.column')
        }
      }
    });

    // BaseAnalysisFormModel.prototype._setSchema.call(this, this._filterSchemaFieldsByType({
    //   source: this._primarySourceSchemaItem(),
    //   category: {
    //     type: 'Enabler',
    //     title: _t('editor.layers.analysis-form.categorize-by'),
    //     help: _t('editor.layers.analysis-form.categorize-by-help')
    //   },
    //   category_column: {
    //     type: 'Select',
    //     title: _t('editor.layers.analysis-form.column'),
    //     options: this._columnOptions.all()
    //   },
    //   weight: {
    //     type: 'Enabler',
    //     title: _t('editor.layers.analysis-form.weighted-by'),
    //     help: _t('editor.layers.analysis-form.weighted-by-help')
    //   },
    //   weight_column: {
    //     type: 'Select',
    //     title: _t('editor.layers.analysis-form.column'),
    //     options: this._columnOptions.filterByType('number'),
    //     validators: ['required']
    //   },
    //   aggregate: {
    //     type: 'Enabler',
    //     title: _t('editor.layers.analysis-form.aggregate-by'),
    //     help: _t('editor.layers.analysis-form.aggregate-by-help')
    //   },
    //   aggregate_column_operator: {
    //     type: 'Operators',
    //     title: _t('editor.layers.analysis-form.column'),
    //     options: this._columnOptions.filterByType('number')
    //   }
    // }));
  },

  _onChangeWeight: function () {
    if (this.get('weight') !== '') {
      this.set('type', 'weighted-centroid');
      this.set('weight_column', this.get('weight'));
    } else {
      this.set('type', 'centroid');
      this.unset('weight_column');
    }
    this._setSchema();
  },

  _onChangeCategory: function () {
    if (this.get('category') === '') {
      this.unset('category_column');
    } else {
      this.set('category_column', this.get('category'));
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
    if (this.get('aggregate') !== '') {
      this.set('aggregate_column_operator', {
        operator: 'count',
        attribute: ''
      });
    }
    this._setSchema();
  }
});
