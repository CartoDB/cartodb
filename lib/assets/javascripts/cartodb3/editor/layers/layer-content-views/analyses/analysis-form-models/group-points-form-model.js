var _ = require('underscore');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./group-points.tpl');
var ColumnOptions = require('../column-options');

var ANALYSES_TYPES = require('./group-points-types');

var TYPE_TO_META_MAP = {};
ANALYSES_TYPES.map(function (d) {
  TYPE_TO_META_MAP[d.type] = d;
});

module.exports = BaseAnalysisFormModel.extend({
  parse: function (attrs) {
    return _.defaults(
      _.pick(attrs, 'id', 'source'), // maintain default attrs
      this._typeDef(attrs.type).parse(attrs)
    );
  },
  initialize: function () {
    console.log('hello');
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    this._columnOptions = new ColumnOptions({}, {
      configModel: this._configModel,
      nodeDefModel: this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.get('source'))
    });

    this.listenTo(this._columnOptions, 'columnsFetched', this._setSchema);

    this.on('change:type', this._setSchema, this);

    this._setSchema();
  },

  _onTypeChanged: function () {
    this._replaceAttrs();
    this._setSchema();
  },

  _replaceAttrs: function () {
    var attrs = this.parse(this.attributes);
    this.clear({ silent: true });
    this.set('type', attrs.type, { silent: true }); // re-set type to avoid change:type event to trigger again
    this.set(_.extend(attrs, this.defaults));
  },

  updateNodeDefinition: function (nodeDefModel) {
    var attrs = this._formatAttrs(this.attributes);
    nodeDefModel.clear({ silent: true });
    nodeDefModel.set(attrs);
  },

  _formatAttrs: function (formAttrs) {
    var customFormattedFormAttrs = this._typeDef().formatAttrs(formAttrs, this._columnOptions);
    return BaseAnalysisFormModel.prototype._formatAttrs.call(this, customFormattedFormAttrs);
  },

  getTemplate: function () {
    return template;
  },

  getTemplateData: function () {
    console.log(this._typeDef().type);
    console.log(this._typeDef().parametersDataFields);
    return { parametersDataFields: this._typeDef().parametersDataFields };
  },

  _filterSchemaFieldsByType: function (schema) {
    // Always include the source field in addition to the type-specific fields
    var fields = ['source', 'type'].concat(this._typeDef().parametersDataFields.split(','));
    return _.pick(schema, fields);
  },

  /**
   * @override {BaseAnalysisFormModel._setSchema}
   */
  _setSchema: function () {
    BaseAnalysisFormModel.prototype._setSchema.call(this, this._filterSchemaFieldsByType({
      source: this._primarySourceSchemaItem(),
      type: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.type'),
        options: ANALYSES_TYPES.map(function (d) {
          return {
            val: d.type,
            label: d.label
          };
        }, this)
      },
      category_column: {
        type: 'EnablerEditor',
        title: '',
        label: _t('editor.layers.analysis-form.group-by'),
        editor: {
          type: 'Select',
          options: this._columnOptions.all(),
          editorAttrs: {
            showLabel: false
          }
        }
      }
    }));
  },

  _getColumnOptions: function (attr, attrType) {
    var opts = this._columnOptions.filterByType(attrType);

    if (this._columnOptions.get('columnsFetched') && this.get(attr)) {
      var attrExists = false;
      var value = this.get(attr);

      var customValue = {
        val: value,
        label: '"' + value + '"'
      };

      if (opts && opts.length) {
        attrExists = _.find(opts, function (attr) {
          return attr.val === customValue.val;
        });
      }

      if (!attrExists) {
        opts.push(customValue);
        opts = _.sortBy(opts, function (d) {
          return d.val;
        });
      }
    }
    return opts;
  },

  _typeDef: function (type) {
    type = type || this.get('type');
    return TYPE_TO_META_MAP[type];
  }
});
