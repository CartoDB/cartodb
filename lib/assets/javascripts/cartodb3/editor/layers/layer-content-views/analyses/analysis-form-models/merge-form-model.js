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
    if (attrs.source_geometry === 'left_source' || !attrs.source_geometry) {
      attrs.source_geometry_selector = attrs.left_source;
    } else {
      attrs.source_geometry_selector = attrs.right_source;
    }

    return attrs;
  },

  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    this.on('change', this._onChange, this);

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
    this.on('change:right_source', this._onChangeRightSource, this);
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

    if (this.get('left_source') === this.get('source_geometry_selector')) {
      customFormattedFormAttrs.source_geometry = 'left_source';
    } else {
      customFormattedFormAttrs.source_geometry = 'right_source';
    }

    if (!formAttrs.left_source_columns) {
      customFormattedFormAttrs.left_source_columns = [];
    }

    if (!formAttrs.right_source_columns) {
      customFormattedFormAttrs.right_source_columns = [];
    }

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

  _onChangeRightSource: function () {
    this._fetchRightColumns();
    this.unset('right_source_column');
    this.set('right_source_columns', []);
  },

  _getLeftSourceLabel: function () {
    var source = this._getSourceOption()[0];
    if (source) {
      return source.layerName;
    }
  },

  _getRightSourceLabel: function () {
    var source = this._getSourceOptionsForSourceId(this.get('right_source'), 'right_source', '*');
    if (source) {
      return source.label;
    }
  },

  /**
   * @override {BaseAnalysisFormModel._setSchema}
   */
  _setSchema: function () {
    BaseAnalysisFormModel.prototype._setSchema.call(this, this._filterSchemaFieldsByType({
      left_source: this._primarySourceSchemaItem(_t('editor.layers.analysis-form.input-num', { num: 1 })),
      right_source: {
        type: 'NodeDataset',
        title: _t('editor.layers.analysis-form.input-num', { num: 2 }),
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
          { label: _t('editor.layers.analysis-form.left'), val: 'left', help: _t('editor.layers.analysis-form.merge-type.left') },
          { label: _t('editor.layers.analysis-form.inner'), val: 'inner', help: _t('editor.layers.analysis-form.merge-type.inner') }
        ],
        validators: ['required']
      },
      left_source_column: {
        type: 'Select',
        title: this._getLeftSourceLabel(),
        options: this._leftColumnOptions.filterByType(['string', 'number']),
        validators: ['required']
      },
      right_source_column: {
        type: 'Select',
        title: this._getRightSourceLabel(),
        options: this._rightColumnOptions.filterByType(['string', 'number']),
        validators: ['required']
      },
      source_geometry_selector: {
        type: 'NodeDataset',
        title: _t('editor.layers.analysis-form.geometry-from'),
        options: this._getSourcesSelector(),
        editorAttrs: {
          disabled: this._isSourceDisabled('right_source')
        }
      },
      left_source_columns: {
        type: 'MultiSelect',
        title: this._getLeftSourceLabel(),
        options: this._leftColumnOptions.filterByType(['string', 'number'])
      },
      right_source_columns: {
        type: 'MultiSelect',
        title: this._getRightSourceLabel(),
        options: this._rightColumnOptions.filterByType(['string', 'number'])
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
      if (source) {
        return {
          val: this.get('right_source'),
          type: source.type,
          nodeTitle: this._analyses.title(source),
          layerName: source.layerName,
          color: source.color
        };
      }
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

    if (this._isFetchingOptions()) {
      return [{
        val: currentSource,
        label: _t('editor.layers.analysis-form.loading'),
        isLoading: true
      }];
    } else {
      // fetched
      var source = this._getSourceOption()[0];
      return this._analysisSourceOptionsModel
      .getSelectOptions(requiredSimpleGeometryType)
      .filter(function (d) {
        return d.val !== source.val && d.val !== source.layerName;
      });
    }
  },

  _getSourceOption: function () {
    var leftSourceId = this.get('left_source');
    var nodeDefModel = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(leftSourceId);
    return [{
      val: leftSourceId,
      type: 'node',
      nodeTitle: this._analyses.title(nodeDefModel),
      layerName: this._layerDefinitionModel.getName(),
      color: this._layerDefinitionModel.get('color')
    }];
  },

  _onChange: function () {
    var changedSourceId = this.changed.left_source || this.changed.right_source;
    if (changedSourceId) {
      this._analysisSourceOptionsModel.createSourceNodeUnlessExisting(changedSourceId);
    }
  }
});
