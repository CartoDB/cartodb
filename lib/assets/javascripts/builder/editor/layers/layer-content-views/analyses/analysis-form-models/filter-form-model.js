var _ = require('underscore');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./filter-form.tpl');
var ColumnData = require('builder/editor/layers/layer-content-views/analyses/column-data');
var ColumnRowData = require('builder/data/column-row-data');
var ColumnOptions = require('builder/editor/layers/layer-content-views/analyses/column-options');

var FILTER_TYPES = require('./filter-types');
var TYPE_TO_META_MAP = {};

FILTER_TYPES.map(function (d) {
  TYPE_TO_META_MAP[d.type] = d;
});

var FILTER_RANGE_KINDS = [
  { val: 'between', label: _t('editor.layers.filter-options.between') },
  { val: 'is-equal-to', label: _t('editor.layers.filter-options.is-equal-to') },
  { val: 'is-greater-than', label: _t('editor.layers.filter-options.is-greater-than') },
  { val: 'is-greater-or-equal-than', label: _t('editor.layers.filter-options.is-greater-or-equal-than') },
  { val: 'is-less-than', label: _t('editor.layers.filter-options.is-less-than') },
  { val: 'is-less-or-equal-than', label: _t('editor.layers.filter-options.is-less-or-equal-than') }
];

var LESS_GREATER_KINDS = ['is-greater-or-equal-than', 'is-less-or-equal-than', 'is-less-than', 'is-less-than'];

module.exports = BaseAnalysisFormModel.extend({

  defaults: {
    accept_reject: 'accept'
  },

  parse: function (attrs) {
    return _.defaults(
      _.pick(attrs, 'id', 'source', 'column'), // maintain default attrs
      this._typeDef(attrs.type).parse(attrs)
    );
  },

  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    this._nodeDefModel = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.get('source'));

    this._columnData = new ColumnData({
      column: this.get('column'),
      type: this._getSelectedColumnType()
    }, {
      nodeDefModel: this._nodeDefModel,
      configModel: this._configModel
    });

    this._columnRowData = new ColumnRowData({
      column: this.get('column')
    }, {
      nodeDefModel: this._nodeDefModel,
      configModel: this._configModel
    });

    this._columnOptions = new ColumnOptions({}, {
      configModel: this._configModel,
      nodeDefModel: this._nodeDefModel
    });

    this.on('change:kind change:column', this._updateSchema, this);
    this.on('change:histogram_stats', this._setSchema, this);

    this.listenTo(this._columnOptions, 'columnsFetched', this._setSchema);
    this.listenTo(this._columnRowData, 'columnsFetched', this._setSchema);
    this.listenTo(this._columnData, 'columnsFetched', this._storeHistogramStats);

    this._columnData.fetch();
    this._columnRowData.fetch();
    this._setSchema();
  },

  getTemplate: function () {
    return template;
  },

  getTemplateData: function () {
    return {
      column: this.get('column'),
      histogram_stats: this.get('histogram_stats'),
      parametersDataFields: this._typeDef().getParameters(this.get('kind'), this.get('column'))
    };
  },

  _formatAttrs: function (formAttrs) {
    var column = this.get('column');
    var customFormattedFormAttrs = this._typeDef().formatAttrs(formAttrs, column);
    return BaseAnalysisFormModel.prototype._formatAttrs.call(this, customFormattedFormAttrs);
  },

  /**
   * @override {BaseAnalysisFormModel.updateNodeDefinition}
   */
  updateNodeDefinition: function (nodeDefModel) {
    var attrs = this._formatAttrs(this.attributes);
    nodeDefModel.clear({ silent: true });
    nodeDefModel.set(attrs);
  },

  _getInputOptions: function () {
    return _.map(this._columnRowData.getRows(), function (d) {
      return { label: d, val: d };
    });
  },

  _setSchema: function () {
    var requiredValidators = [{
      type: 'requiredBoolean'
    }];

    BaseAnalysisFormModel.prototype._setSchema.call(this, this._filterSchemaFieldsByType({
      source: this._primarySourceSchemaItem(_t('editor.layers.analysis-form.base-layer')),
      column: {
        type: 'Select',
        text: _t('editor.layers.analysis-form.column'),
        options: this._columnOptions.filterByType(['string', 'number', 'boolean']),
        dialogMode: 'float',
        validators: ['required']
      },
      kind: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.filter'),
        dialogMode: 'float',
        options: this._getKindOptions(),
        editorAttrs: {
          showSearch: false
        }
      },
      greater_than_or_equal: {
        type: 'Text',
        title: this._getMinOrEqualLabel(),
        validators: ['required'],
        editorAttrs: {
          placeholder: _t('editor.layers.analysis-form.write-min-or-equal-value')
        }
      },
      less_than_or_equal: {
        type: 'Text',
        title: this._getMaxOrEqualLabel(),
        validators: ['required'],
        editorAttrs: {
          placeholder: _t('editor.layers.analysis-form.write-max-or-equal-value')
        }
      },
      greater_than: {
        type: 'Text',
        title: this._getMinLabel(),
        validators: ['required'],
        editorAttrs: {
          placeholder: _t('editor.layers.analysis-form.write-min-value')
        }
      },
      less_than: {
        type: 'Text',
        title: this._getMaxLabel(),
        validators: ['required'],
        editorAttrs: {
          placeholder: _t('editor.layers.analysis-form.write-max-value')
        }
      },
      text: {
        type: this._getInputType(),
        title: _t('editor.layers.analysis-form.value'),
        validators: this._isBoolean() ? requiredValidators : ['required'],
        options: this._getInputOptions(),
        dialogMode: 'float',
        editorAttrs: {
          column: 'column',
          nodeDefModel: this._nodeDefModel,
          configModel: this._configModel,
          placeholder: _t('editor.layers.analysis-form.select-value')
        }
      },
      accept_reject: {
        type: 'Radio',
        title: _t('editor.layers.analysis-form.results'),
        options: [
          { label: _t('editor.layers.analysis-form.show'), val: 'accept' },
          { label: _t('editor.layers.analysis-form.hide'), val: 'reject' }
        ],
        validators: ['required']
      }
    }));

    this._generateHistogram();
    this._generateHistogramStats();
  },

  _getInputType: function () {
    var rows = this._columnRowData.getRows();
    return rows && rows.length ? 'LazySelect' : 'Text';
  },

  _getMinOrEqualLabel: function () {
    return _.contains(LESS_GREATER_KINDS, this.get('kind')) ? _t('editor.layers.analysis-form.value') : _t('editor.layers.analysis-form.min-or-equal');
  },

  _getMaxOrEqualLabel: function () {
    return _.contains(LESS_GREATER_KINDS, this.get('kind')) ? _t('editor.layers.analysis-form.value') : _t('editor.layers.analysis-form.max-or-equal');
  },

  _getMinLabel: function () {
    return _.contains(LESS_GREATER_KINDS, this.get('kind')) ? _t('editor.layers.analysis-form.value') : _t('editor.layers.analysis-form.min');
  },

  _getMaxLabel: function () {
    return _.contains(LESS_GREATER_KINDS, this.get('kind')) ? _t('editor.layers.analysis-form.value') : _t('editor.layers.analysis-form.max');
  },

  _getSourceColumns: function () {
    var nodeDefModel = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.get('source'));

    var sourceColumns = nodeDefModel.querySchemaModel.columnsCollection.map(function (columnModel) {
      var columnName = columnModel.get('name');
      return {
        val: columnName,
        label: columnName,
        type: columnModel.get('type')
      };
    });

    return sourceColumns;
  },

  _filterSchemaFieldsByType: function (schema) {
    // Always include the source and column fields in addition to the type-specific fields
    var kind = this.get('kind');
    var column = this.get('column');
    var fields = ['source', 'column'];
    var parameters = this._typeDef().getParameters(kind, column);
    if (parameters !== '') {
      fields = fields.concat(parameters.split(','));
    }
    return _.pick(schema, fields);
  },

  _updateSchema: function () {
    var columnType = this._getSelectedColumnType();
    this._columnData.set({
      column: this.get('column'),
      type: columnType
    });
    this._columnRowData.set('column', this.get('column'));

    this._setType();
    this._setSchema();
  },

  _getSelectedColumnType: function () {
    var columns = this._getSourceColumns();
    var columnType = null;

    for (var i in columns) {
      if (columns[i]['label'] === this.get('column')) {
        columnType = columns[i]['type'];
      }
    }

    return columnType;
  },

  _getKindOptions: function () {
    if (this.get('type') !== 'filter-category' || this.get('kind') === 'is-equal-to') {
      return FILTER_RANGE_KINDS;
    }
  },

  _setType: function () {
    var columnType = this._getSelectedColumnType();
    var kind = this.get('kind');
    var attrs = {
      type: 'filter-range'
    };

    if (columnType === 'number' && kind === 'is-equal-to') {
      attrs.type = 'filter-category';
      attrs.accept_reject = 'accept';
    } else if (columnType === 'number') {
      attrs.kind = this._typeDef(attrs.type).getKind(kind);
    } else if (columnType === 'string') {
      attrs.kind = null;
      attrs.type = 'filter-category';
    } else if (columnType === 'boolean') {
      attrs.kind = 'is-boolean';
      attrs.type = 'filter-category';
    }

    this.set(attrs);
  },

  _isBoolean: function () {
    return this._getSelectedColumnType() === 'boolean';
  },

  _getColumnType: function (columnName) {
    var nodeDefModel = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.get('source'));
    var column = nodeDefModel.querySchemaModel.columnsCollection.find(function (c) {
      return c.get('name') === columnName;
    }, this);

    return column && column.get('type');
  },

  _generateHistogramStats: function (data) {
    if (data) {
      this.trigger('onColData', this);
    }
  },

  _storeHistogramStats: function (data) {
    if (data && this._getSelectedColumnType() === 'number') {
      this.set('histogram_stats', data.attributes);
    } else {
      this.set('histogram_stats', null);
    }
  },

  _generateHistogram: function () {
    var type;
    var tableName = this._getSourceOption()[0].layerName;
    var columnName = this.get('column');

    if (columnName) {
      type = this._getColumnType(columnName);
    }

    if (tableName && columnName && type === 'number') {
      this.trigger('generateHistogram', { columnName: columnName, tableName: tableName });
    }
  },

  _typeDef: function (type) {
    type = type || this.get('type');
    return TYPE_TO_META_MAP[type];
  }
});
