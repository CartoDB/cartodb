var _ = require('underscore');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./merge-form.tpl');
var ColumnOptions = require('../column-options');

var MERGE_FIELDS = 'join_operator,left_source_column,right_source_column,source_geometry_selector,left_source_columns,right_source_columns';

/**
 * Form model for the merge analysis
 */
module.exports = BaseAnalysisFormModel.extend({
  defaults: {
    join_operator: 'inner',
    source_geometry: 'left_source',
    right_source_columns: []
  },

  parse: function (attrs) {
    return attrs;
  },

  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    this._leftColumnOptions = new ColumnOptions({}, {
      configModel: this._configModel
    });

    this._rightColumnOptions = new ColumnOptions({}, {
      configModel: this._configModel
    });

    this.listenTo(this._analysisSourceOptionsModel, 'change:fetching', this._setSchema);

    this.listenTo(this._leftColumnOptions, 'columnsFetched', this._setSchema);
    this.listenTo(this._rightColumnOptions, 'columnsFetched', this._setSchema);

    this.on('change:type', this._setSchema, this);
    this.on('change:right_source', this._fetchRightColumns, this);
    this.on('change:join_operator, change:right_source, change:left_source_column, change:right_source_column', this._setSchema, this);

    this._setSchema();
    this._fetchLeftColumns();
    this._fetchRightColumns();
  },

  _getFormFieldNames: function () {
    return MERGE_FIELDS;
  },

  _getFormatFieldNames: function () {
    return MERGE_FIELDS;
  },

  _formatAttrs: function (formAttrs) {
    var customFormattedFormAttrs = _.pick(formAttrs, ['id', 'type', 'left_source', 'right_source'].concat(this._getFormatFieldNames().split(',')));

    return BaseAnalysisFormModel.prototype._formatAttrs.call(this, customFormattedFormAttrs);
  },

  getTemplate: function () {
    return template;
  },

  getTemplateData: function () {
    return {
      right_source: this.get('right_source'),
      hasLeftAndRightSourceColumns: this.get('left_source_column') && this.get('right_source_column')
    };
  },

  _filterSchemaFieldsByType: function (schema) {
    // Always include the source and target fields in addition to the type-specific fields
    return _.pick(schema, ['left_source', 'right_source'].concat(this._getFormFieldNames().split(',')));
  },

  /**
   * @override {BaseAnalysisFormModel._setSchema}
   */
  _setSchema: function () {
    BaseAnalysisFormModel.prototype._setSchema.call(this, this._filterSchemaFieldsByType({
      left_source: this._primarySourceSchemaItem('left source'),
      right_source: {
        type: 'NodeDataset',
        title: 'right source',
        options: this._getSourceOptionsForSource('right_source', '*'),
        validators: ['required'],
        editorAttrs: {
          disabled: this._isSourceDisabled('right_source')
        }
      },
      join_operator: {
        type: 'Radio',
        title: _t('editor.layers.analysis-form.join-type'),
        options: [
          { label: _t('editor.layers.analysis-form.left'), val: 'left' },
          { label: _t('editor.layers.analysis-form.inner'), val: 'inner' }
        ],
        validators: ['required']
      },
      left_source_column: {
        type: 'Select',
        title: 'left source column',
        options: this._leftColumnOptions.all(),
        validators: ['required']
      },
      right_source_column: {
        type: 'Select',
        title: 'right source column',
        options: this._rightColumnOptions.all(),
        validators: ['required']
      },
      source_geometry_selector: {
        type: 'NodeDataset',
        title: 'Geometry from',
        options: this._getSourcesSelector(),
        editorAttrs: {
          disabled: this._isSourceDisabled('right_source')
        }
      },
      left_source_columns: {
        type: 'MultiSelect',
        title: 'Left source columns',
        options: this._leftColumnOptions.all()
      },
      right_source_columns: {
        type: 'MultiSelect',
        title: 'Right source columns',
        options: this._rightColumnOptions.all()
      }
    }));
  },

  _fetchColumns: function (sourceName, columnOptions) {
    var source = this.get(sourceName);

    var nodeDefModel = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(source);

    if (nodeDefModel) {
      columnOptions.setNode(nodeDefModel);
    } else if (source) {
      columnOptions.setDataset(source);
    }
  },

  _fetchLeftColumns: function () {
    this._fetchColumns('left_source', this._leftColumnOptions);
  },

  _fetchRightColumns: function () {
    this._fetchColumns('right_source', this._rightColumnOptions);
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

  _getSourcesSelector: function () {
    return _.compact([this._getSourceOption()[0], this._getRightSource()]);
  },

  _getRightSource: function () {
    if (this.get('right_source')) {
      var source = this._getSourceOptionsForSourceId(this.get('right_source'), 'right_source', '*');

      return {
        val: this.get('right_source'),
        type: source.type,
        layerName: source.layerName,
        color: source.color
      };
    }
  },

  _getSourceOptionsForSourceId: function (sourceId, sourceAttrName, requiredSimpleGeometryType) {
    return this._analysisSourceOptionsModel
    .getSelectOptions(requiredSimpleGeometryType)
    .find(function (d) {
      // Can't select own layer as source, so exclude it
      return d.val === sourceId;
    });
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
      var sourceId = this._layerDefinitionModel.get('right_source');
      return this._analysisSourceOptionsModel
      .getSelectOptions(requiredSimpleGeometryType)
      .filter(function (d) {
        // Can't select own layer as source, so exclude it
        return d.val !== sourceId;
      });
    }
  }
});
