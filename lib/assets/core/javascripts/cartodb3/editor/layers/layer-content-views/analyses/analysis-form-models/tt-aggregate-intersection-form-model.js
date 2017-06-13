var _ = require('underscore');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./tt-aggregate-intersection-form.tpl');
var ColumnOptions = require('../column-options');
var AGGREGATE_FORMAT_FIELDS_NAMES = [
  'type',
  'aggregate_column',
  'aggregate_function'
];

/**
 * Form model for the aggregate intersection analysis
 */
module.exports = BaseAnalysisFormModel.extend({
  parse: function (attrs) {
    if (!attrs.aggregate_column) {
      attrs.aggregate_column = '1';
    }
    if (!attrs.aggregate_function) {
      attrs.aggregate_function = 'count';
    }
    attrs.aggregate = {
      operator: attrs.aggregate_function,
      attribute: attrs.aggregate_function === 'count' ? '' : attrs.aggregate_column
    };
    attrs.points_source = attrs.source || '';
    attrs.polygons_target = attrs.target || '';
    return attrs;
  },

  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    this._columnOptions = new ColumnOptions({}, {
      configModel: this._configModel
    });

    this.listenTo(this._analysisSourceOptionsModel, 'change:fetching', this._setSchema);
    this.listenTo(this._columnOptions, 'columnsFetched', this._setSchema);

    this.on('change:aggregate', this._onChangeAggregate, this);
    this.on('change:polygons_target', this._onChangeTarget, this);

    this._setSchema();
    this._fetchColumns();
  },

  _formatAttrs: function (formAttrs) {
    var customFormattedFormAttrs = _.pick(formAttrs, ['id', 'points_source', 'polygons_target'].concat(AGGREGATE_FORMAT_FIELDS_NAMES));
    return BaseAnalysisFormModel.prototype._formatAttrs.call(this, customFormattedFormAttrs);
  },

  getTemplate: function () {
    return template;
  },

  getTemplateData: function () {
    return {
      dataFields: 'aggregate'
    };
  },

  _filterSchemaFieldsByType: function (schema) {
    // Always include the source and target fields in addition to the type-specific fields
    return _.pick(schema, ['points_source', 'polygons_target', 'aggregate']);
  },

  /**
   * @override {BaseAnalysisFormModel._setSchema}
   */
  _setSchema: function () {
    BaseAnalysisFormModel.prototype._setSchema.call(this, this._filterSchemaFieldsByType({
      points_source: this._primarySourceSchemaItem(_t('editor.layers.analysis-form.base-layer')),
      polygons_target: {
        type: 'NodeDataset',
        title: _t('editor.layers.analysis-form.intersection-layer'),
        options: this._getSourceOptionsForSource({
          sourceAttrName: 'polygons_target'
        }),
        validators: ['required'],
        dialogMode: 'float',
        editorAttrs: {
          disabled: this._isSourceDisabled('polygons_target')
        }
      },
      aggregate: {
        type: 'Operators',
        title: _t('editor.layers.analysis-form.operation'),
        dialogMode: 'float',
        options: this._columnOptions.filterByType('number')
      }
    }));
  },

  _onChangeAggregate: function () {
    var aggregate = this.get('aggregate');
    this.set({
      aggregate_column: aggregate.attribute || 'cartodb_id',
      aggregate_function: aggregate.operator
    });
  },

  _onChangeTarget: function () {
    this.set({
      aggregate: {
        operator: 'count',
        attribute: ''
      }
    });

    this._analysisSourceOptionsModel.createSourceNodeUnlessExisting(this.get('polygons_target'));
    this._fetchColumns();
  },

  _fetchColumns: function () {
    var target = this.get('polygons_target');
    var nodeDefModel = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(target);

    if (nodeDefModel) {
      this._columnOptions.setNode(nodeDefModel);
    } else if (target) {
      this._columnOptions.setDataset(target);
    }
  },

  _isSourceDisabled: function (sourceAttrName) {
    return this._isPrimarySource(sourceAttrName) || this._isFetchingOptions();
  }
});
