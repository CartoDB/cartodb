var _ = require('underscore');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./filter-form.tpl');
var ColumnRowData = require('../column-row-data');
var ColumnRowData = require('../../../../../data/column-row-data');
var ColumnOptions = require('../column-options');

var FILTER_TYPES = require('./filter-types');
var TYPE_TO_META_MAP = {};

FILTER_TYPES.map(function (d) {
  TYPE_TO_META_MAP[d.type] = d;
});

var FILTER_RANGE_KINDS = [
  { val: 'between', label: _t('editor.layers.filter-options.between') },
  { val: 'is-equal-to', label: _t('editor.layers.filter-options.is-equal-to') },
  { val: 'is-greater-than', label: _t('editor.layers.filter-options.is-greater-than') },
  { val: 'is-less-than', label: _t('editor.layers.filter-options.is-less-than') }
];

var LESS_GREATER_KINDS = ['is-greater-than', 'is-less-than'];

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

    var nodeDefModel = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.get('source'));

    this._columnData = new ColumnData({
      column: this.get('column')
    }, {
      nodeDefModel: nodeDefModel,
      configModel: this._configModel
    });

    this._columnRowData = new ColumnRowData({
      column: this.get('column')
    }, {
      nodeDefModel: nodeDefModel,
      configModel: this._configModel
    });

    this._columnOptions = new ColumnOptions({}, {
      configModel: this._configModel,
      nodeDefModel: nodeDefModel
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
      parametersDataFields: this._typeDef().getParameters(this.get('kind'))
    };
  },

  _formatAttrs: function (formAttrs) {
    var customFormattedFormAttrs = this._typeDef().formatAttrs(formAttrs);
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

  _setSchema: function () {
    BaseAnalysisFormModel.prototype._setSchema.call(this, this._filterSchemaFieldsByType({
      source: this._primarySourceSchemaItem(_t('editor.layers.analysis-form.input')),
      column: {
        type: 'Select',
        text: _t('editor.layers.analysis-form.column'),
        options: this._columnOptions.filterByType(['string', 'number']),
        validators: ['required']
      },
      kind: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.filter'),
        options: this._getKindOptions(),
        editorAttrs: {
          showSearch: false
        }
      },
      min: {
        type: 'Text',
        title: this._getMinLabel(),
        validators: ['required'],
        editorAttrs: {
          placeholder: 'Write min value'
        }
      },
      max: {
        type: 'Text',
        title: this._getMaxLabel(),
        validators: ['required'],
        editorAttrs: {
          placeholder: 'Write max value'
        }
      },
      text: {
        type: this._getInputType(),
        title: _t('editor.layers.analysis-form.input'),
        validators: ['required'],
        options: _.map(this._columnRowData.getRows(), function (d) {
          return { label: d, val: d };
        }),
        editorAttrs: {
          showSearch: true,
          allowFreeTextInput: true
        }
      },
      accept_reject: {
        type: 'Radio',
        title: _t('editor.layers.analysis-form.result'),
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
    return rows && rows.length ? 'Select' : 'Text';
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
    var fields = ['source', 'column'].concat(this._typeDef().getParameters(kind).split(','));
    return _.pick(schema, fields);
  },

  _updateSchema: function () {
    this._columnData.set('column', this.get('column'));
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
    } else if (columnType === 'string') {
      attrs.kind = null;
      attrs.type = 'filter-category';
    }

    this.set(attrs);
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
