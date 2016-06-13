var _ = require('underscore');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./filter-form.tpl');

var FILTER_TYPES = require('./filter-types');
var TYPE_TO_META_MAP = {};
FILTER_TYPES.map(function (d) {
  TYPE_TO_META_MAP[d.type] = d;
});

module.exports = BaseAnalysisFormModel.extend({

  parse: function (attrs) {
    return _.defaults(
      _.pick(attrs, 'id', 'source', 'column', 'max', 'result', 'kind'), // maintain default attrs
      this._typeDef(attrs.type).parse(attrs)
    );
  },

  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    this._setSchema();

    this.on('change:type', this._onTypeChanged, this);
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
          options: [
            {val: 'top', label: _t('editor.layers.filter-options.top')},
            {val: 'bottom', label: _t('editor.layers.filter-options.bottom')},
            {val: 'is-equal-to', label: _t('editor.layers.filter-options.is-equal-to')},
            {val: 'is-greater-than', label: _t('editor.layers.filter-options.is-greater-than')},
            {val: 'is-less-than', label: _t('editor.layers.filter-options.is-less-than')}
          ],
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
        },
        result: {
          type: 'Radio',
          title: _t('editor.layers.analysis-form.result'),
          options: [
            {val: 'show', label: 'Show'},
            {val: 'hide', label: 'Hide'}
          ]
        }
      })
    );
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

  _onTypeChanged: function () {
    this._replaceAttrs();
    this._setSchema();
  },

  _replaceAttrs: function () {
    var attrs = this.parse(this.attributes);
    this.clear({silent: true});
    this.set('type', attrs.type, {silent: true}); // re-set type to avoid change:type event to trigger again
    this.set(attrs);
  },

  _typeDef: function (type) {
    type = type || this.get('type');
    return TYPE_TO_META_MAP[type];
  }
});
