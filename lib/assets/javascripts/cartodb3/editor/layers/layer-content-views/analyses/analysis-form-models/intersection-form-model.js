var _ = require('underscore');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./intersection-form.tpl');
var ColumnOptions = require('../column-options');

var AGGREGATE_INTERSECTION_FIELDS = 'type,aggregate';
var INTERSECTION_FIELDS = 'type';
/**
 * Form model for the intersection analysis
 */
module.exports = BaseAnalysisFormModel.extend({
  parse: function (attrs) {
    if (!attrs.aggregate_column) {
      attrs.aggregate_column = 'cartodb_id';
    }
    if (!attrs.aggregate_function) {
      attrs.aggregate_function = 'count';
    }
    attrs.aggregate = {
      operator: attrs.aggregate_function,
      attribute: attrs.aggregate_function === 'count' ? '' : attrs.aggregate_column
    };
    return attrs;
  },

  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    this._columnOptions = new ColumnOptions({}, {
      configModel: this._configModel
    });

    this.listenTo(this._analysisSourceOptionsModel, 'change:fetching', this._setSchema);
    this.listenTo(this._columnOptions, 'columnsFetched', this._setSchema);

    this.on('change:type', this._setSchema, this);
    this.on('change:aggregate', this._onChangeAggregate, this);
    this.on('change:target', this._onChangeTarget, this);

    this._setSchema();
    this._fetchColumns();
  },

  _getFormFieldNames: function () {
    if (this.get('type') === 'aggregate-intersection') {
      return AGGREGATE_INTERSECTION_FIELDS;
    } else {
      return INTERSECTION_FIELDS;
    }
  },

  _getFormatFieldNames: function () {
    if (this.get('type') === 'aggregate-intersection') {
      return 'type,aggregate_column,aggregate_function';
    } else {
      return INTERSECTION_FIELDS;
    }
  },

  _formatAttrs: function (formAttrs) {
    var customFormattedFormAttrs = _.pick(formAttrs, ['id', 'source', 'target'].concat(this._getFormatFieldNames().split(',')));

    return BaseAnalysisFormModel.prototype._formatAttrs.call(this, customFormattedFormAttrs);
  },

  getTemplate: function () {
    return template;
  },

  getTemplateData: function () {
    return {
      dataFields: this._getFormFieldNames()
    };
  },

  _filterSchemaFieldsByType: function (schema) {
    // Always include the source and target fields in addition to the type-specific fields
    return _.pick(schema, ['source', 'target'].concat(this._getFormFieldNames().split(',')));
  },

  /**
   * @override {BaseAnalysisFormModel._setSchema}
   */
  _setSchema: function () {
    BaseAnalysisFormModel.prototype._setSchema.call(this, this._filterSchemaFieldsByType({
      source: this._primarySourceSchemaItem(),
      target: {
        type: 'NodeDataset',
        title: _t('editor.layers.analysis-form.target'),
        options: this._getSourceOptionsForSource('target', 'point'),
        validators: ['required'],
        editorAttrs: {
          disabled: this._isSourceDisabled('target')
        }
      },
      type: {
        type: 'Radio',
        title: _t('editor.layers.analysis-form.type'),
        options: [
          { label: 'Filter', val: 'intersection' },
          { label: 'Aggregate', val: 'aggregate-intersection' }
        ]
      },
      aggregate: {
        type: 'Operators',
        title: _t('editor.layers.analysis-form.operation'),
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
    this.set('aggregate', {
      operator: 'count',
      attribute: ''
    });
    this._analysisSourceOptionsModel.createSourceNodeUnlessExisting(this.get('target'));
    this._fetchColumns();
  },

  _fetchColumns: function () {
    var target = this.get('target');

    var nodeDefModel = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(target);

    if (nodeDefModel) {
      this._columnOptions.setNode(nodeDefModel);
    } else if (target) {
      this._columnOptions.setDataset(target);
    }
  },

  _isSourceDisabled: function (sourceAttrName) {
    return this._isPrimarySource(sourceAttrName) || this._isFetchingOptions();
  },

  _isPrimarySource: function (sourceAttrName) {
    return sourceAttrName === this.get('primary_source_name');
  },

  _isFetchingOptions: function () {
    return this._analysisSourceOptionsModel.get('fetching');
  },

  _getSourceOptionsForSource: function (sourceAttrName, requiredSimpleGeometryType) {
    var currentSource = this.get(sourceAttrName);

    if (this._isPrimarySource(sourceAttrName)) {
      return [currentSource];
    } else if (this._isFetchingOptions()) {
      return [{
        val: currentSource,
        label: _t('editor.layers.analysis-form.loading'),
        isLoading: true
      }];
    } else {
      // fetched
      var sourceId = this._layerDefinitionModel.get('source');
      return this._analysisSourceOptionsModel
        .getSelectOptions(requiredSimpleGeometryType)
        .filter(function (d) {
          // Can't select own layer as source, so exclude it
          return d.val !== sourceId;
        });
    }
  },

  _onChange: function () {
  }
});
