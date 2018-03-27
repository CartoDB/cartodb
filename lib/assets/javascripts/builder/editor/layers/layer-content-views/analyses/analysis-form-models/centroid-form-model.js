var _ = require('underscore');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./centroid-form.tpl');
var ColumnOptions = require('builder/editor/layers/layer-content-views/analyses/column-options');

var FORMAT_FIELD_NAMES = 'category_column,aggregation,aggregation_column,weight_column';
var PARAMETERS_DATA_FIELDS = 'source,category,weight';

/**
 * Form model for a centroid and weighted-centroid analysis
 * It has a rather complicated schema, that depends on several data points and state.
 * https://github.com/CartoDB/camshaft/blob/master/reference/versions/0.38.0/reference.json
 */

module.exports = BaseAnalysisFormModel.extend({
  parse: function (attrs) {
    var operator = {
      operator: attrs.aggregation || 'count',
      attribute: attrs.aggregation === 'count' ? '' : attrs.aggregation_column
    };

    var aggregate_value = (!!attrs.aggregation_column || !!attrs.aggregation) ? operator : '';

    return _.extend(attrs, {
      category: attrs.category_column || '',
      weight: attrs.weight_column || '',
      aggregate: aggregate_value
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
    this.on('change:aggregate', this._updateAggregation, this);
    this.on('change:weight', this._onChangeWeight, this);
    this.on('change:type', this._setSchema, this);

    this._updateAggregation();

    this._setSchema();
  },

  updateNodeDefinition: function (nodeDefModel) {
    var attrs = this._formatAttrs(this.attributes);
    nodeDefModel.clear({silent: true});
    nodeDefModel.set(attrs);
  },

  _getFormatFieldNames: function () {
    var fields = FORMAT_FIELD_NAMES.split(',');

    if (this.get('aggregate') === '') {
      fields = _.difference(fields, ['aggregation', 'aggregation_column']);
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
      parametersDataFields: PARAMETERS_DATA_FIELDS
    };
  },

  /*
  /**
   * @override {BaseAnalysisFormModel._setSchema}
   */
  _setSchema: function () {
    var operator = {
      operator: this.get('aggregation'),
      attribute: this.get('aggregation_column')
    };

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
          dialogMode: 'float',
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
          dialogMode: 'float',
          label: _t('editor.layers.analysis-form.column')
        }
      },

      aggregate: {
        type: 'EnablerEditor',
        title: '',
        label: _t('editor.layers.analysis-form.operation'),
        help: _t('editor.layers.analysis-form.aggregate-by-help'),
        defaultValue: operator,
        editor: {
          type: 'Operators',
          options: this._columnOptions.filterByType('number'),
          dialogMode: 'float',
          label: _t('editor.layers.analysis-form.column')
        }
      }
    });
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
    // category_column is optional but if we send it empty,
    // it has influence in the final result
    if (this.get('category') === '') {
      this.unset('category_column');
    } else {
      this.set('category_column', this.get('category'));
    }
    this._setSchema();
  },

  _updateAggregation: function () {
    var aggregate = this.get('aggregate');
    if (aggregate === '') {
      this.set({
        aggregation: 'count',
        aggregation_column: ''
      });
    } else {
      this.set({
        aggregation_column: aggregate.attribute,
        aggregation: aggregate.operator
      });
    }

    this._setSchema();
  }
});
