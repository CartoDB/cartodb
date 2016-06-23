var _ = require('underscore');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./filter-form.tpl');
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

module.exports = BaseAnalysisFormModel.extend({

  parse: function (attrs) {
    return _.defaults(
      _.pick(attrs, 'id', 'source', 'column'), // maintain default attrs
      this._typeDef(attrs.type).parse(attrs)
    );
  },

  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    var nodeDefModel = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.get('source'));

    this._columnOptions = new ColumnOptions({}, {
      nodeDefModel: nodeDefModel
    });

    this.on('change:kind, change:column', this._updateSchema, this);
    this.listenTo(this._columnOptions, 'columnsFetched', this._setSchema);

    this._setSchema();
  },

  getTemplate: function () {
    return template;
  },

  getTemplateData: function () {
    var p = this._typeDef().getParameters(this.get('kind'));
    return { parametersDataFields: p };
  },

  _formatAttrs: function (formAttrs) {
    var customFormattedFormAttrs = this._typeDef().formatAttrs(formAttrs);
    return BaseAnalysisFormModel.prototype._formatAttrs.call(this, customFormattedFormAttrs);
  },

  /**
   * @override {BaseAnalysisFormModel._updateNodeDefinition}
   */
  _updateNodeDefinition: function (nodeDefModel) {
    var attrs = this._formatAttrs(this.attributes);
    nodeDefModel.clear({ silent: true });
    nodeDefModel.set(attrs);
  },

  _setSchema: function () {
    BaseAnalysisFormModel.prototype._setSchema.call(this, this._filterSchemaFieldsByType({
      source: {
        type: 'Select',
        text: _t('editor.layers.analysis-form.input'),
        options: [ this.get('source') ],
        editorAttrs: { disabled: true }
      },
      column: {
        type: 'Select',
        text: _t('editor.layers.analysis-form.column'),
        options: this._columnOptions.all(),
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
        title: _t('editor.layers.analysis-form.min'),
        validators: ['required']
      },
      max: {
        type: 'Text',
        title: _t('editor.layers.analysis-form.max'),
        validators: ['required']
      },
      text: {
        type: 'Text',
        title: _t('editor.layers.analysis-form.input'),
        validators: ['required']
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
    var attrs {
      type: 'filter-range'
    };

    if (kind === 'is-equal-to') {
      attrs.type = 'filter-category';
      attrs.accept_reject = 'accept';
    } else if (columnType === 'string') {
      attrs.type = 'filter-category';
    }

    this.set(attrs);
  },

  _typeDef: function (type) {
    type = type || this.get('type');
    return TYPE_TO_META_MAP[type];
  }
});
