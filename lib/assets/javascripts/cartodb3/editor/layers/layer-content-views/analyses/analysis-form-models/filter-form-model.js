var _ = require('underscore');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./filter-form.tpl');

var FILTER_TYPES = require('./filter-types');
var TYPE_TO_META_MAP = {};
var FILTER_RANGE_KINDS = [
  {val: 'is-equal-to', label: _t('editor.layers.filter-options.is-equal-to')},
  {val: 'is-greater-than', label: _t('editor.layers.filter-options.is-greater-than')},
  {val: 'is-less-than', label: _t('editor.layers.filter-options.is-less-than')}
];
var FILTER_CATEGORY_KINDS = [
  {val: 'is-equal-to', label: _t('editor.layers.filter-options.is-equal-to')}
];
FILTER_TYPES.map(function (d) {
  TYPE_TO_META_MAP[d.type] = d;
});

module.exports = BaseAnalysisFormModel.extend({

  parse: function (attrs) {
    return _.defaults(
      _.pick(attrs, 'id', 'source', 'column'), // maintain default attrs
      this._typeDef(attrs.type).parse(attrs)
    );
  },

  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    this._setSchema();

    this.on('change:column', this._onColumnChanged, this);
  },

  getTemplate: function () {
    return template;
  },

  getTemplateData: function () {
    return {parametersDataFields: this._typeDef().parametersDataFields};
  },

  _formatAttrs: function (formAttrs) {
    var customFormattedFormAttrs = this._typeDef().formatAttrs(formAttrs);
    return BaseAnalysisFormModel.prototype._formatAttrs.call(this, customFormattedFormAttrs);
  },

  /**
   * @override {BaseAnalysisFormModel._setSchema}
   */
  _setSchema: function () {
    if (this.get('type') === 'filter-range') {
      BaseAnalysisFormModel.prototype._setSchema.call(this,
        this._filterSchemaFieldsByType({
          source: {
            type: 'Select',
            text: _t('editor.layers.analysis-form.input'),
            options: [ this.get('source') ],
            editorAttrs: { disabled: true }
          },
          column: {
            type: 'Select',
            text: _t('editor.layers.analysis-form.column'),
            options: this._getSourceColumns()
          },
          kind: {
            type: 'Select',
            title: _t('editor.layers.analysis-form.filter'),
            options: this._filterKindOptionsByFilterType(),
            editorAttrs: {
              showSearch: false
            }
          },
          max: {
            type: 'Number',
            title: _t('editor.layers.analysis-form.top-range'),
            validators: ['required', {
              type: 'interval',
              min: 1,
              max: 100
            }]
          }
        })
      );
    } else if (this.get('type') === 'filter-category') {
      BaseAnalysisFormModel.prototype._setSchema.call(this,
        this._filterSchemaFieldsByType({
          source: {
            type: 'Select',
            text: _t('editor.layers.analysis-form.input'),
            options: [ this.get('source') ],
            editorAttrs: { disabled: true }
          },
          column: {
            type: 'Select',
            text: _t('editor.layers.analysis-form.column'),
            options: this._getSourceColumns()
          },
          kind: {
            type: 'Select',
            title: _t('editor.layers.analysis-form.filter'),
            options: this._filterKindOptionsByFilterType(),
            editorAttrs: {
              showSearch: false
            }
          },
          text: {
            type: 'Select',
            title: _t('editor.layers.analysis-form.input'),
            options: ['test1', 'test2']
          }
        })
      );
    }
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
    var fields = ['source', 'column'].concat(this._typeDef().parametersDataFields.split(','));
    return _.pick(schema, fields);
  },

  _onTypeChanged: function (type) {
    this.set('type', type);
  },

  _onColumnChanged: function () {
    this._filterKindOptionsByFilterType();
    this._replaceAttrs();
    this._setSchema();
  },

  _selectedColumnType: function () {
    var columns = this._getSourceColumns();
    var columnType = null;

    for (var i in columns) {
      if (columns[i]['label'] === this.get('column')) {
        columnType = columns[i]['type'];
      }
    }

    return columnType;
  },

  _filterKindOptionsByFilterType: function () {
    var columnType = this._selectedColumnType();

    if (columnType === 'number') {
      this._onTypeChanged('filter-range');
      return FILTER_RANGE_KINDS;
    } else if (columnType === 'string') {
      this._onTypeChanged('filter-category');
      return FILTER_CATEGORY_KINDS;
    } else {
      this._onTypeChanged('filter-range');
      return FILTER_RANGE_KINDS;
    }
  },

  _replaceAttrs: function () {
    var attrs = this.parse(this.attributes);
    this.clear({silent: true});
    this.set('column', attrs.column, {silent: true}); // re-set type to avoid change:type event to trigger again
    this.set(attrs);
  },

  _typeDef: function (type) {
    type = type || this.get('type');
    return TYPE_TO_META_MAP[type];
  }
});
