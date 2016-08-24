var _ = require('underscore');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./connect-with-lines.tpl');
var ColumnOptions = require('../column-options');

var CONNECT_WITH_LINES = require('./connect-with-lines-types');

var TYPE_TO_META_MAP = {};
CONNECT_WITH_LINES.map(function (d) {
  TYPE_TO_META_MAP[d.type] = d;
});

/**
 * Form model for a convex hull analysis
 */
module.exports = BaseAnalysisFormModel.extend({
  defaults: {
    closest: true,
    order_type: 'asc'
  },

  parse: function (attrs) {
    return _.defaults(
      _.pick(attrs, 'id', 'source'), // maintain default attrs
      this._typeDef(attrs.type).parse(attrs)
    );
  },
  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    this._columnOptions = new ColumnOptions({}, {
      configModel: this._configModel,
      nodeDefModel: this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.get('source'))
    });

    this.listenTo(this._columnOptions, 'columnsFetched', this._setSchema);
    this.on('change:type', this._onTypeChanged, this);
    this.on('change:order', this._setSchema, this);
    this.on('change:closest', this._setSchema, this);

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
    return {
      type: this.get('type'),
      order: this.get('order'),
      parametersDataFields: this._typeDef().parametersDataFields
    };
  },

  _filterSchemaFieldsByType: function (schema) {
    // Always include the source field in addition to the type-specific fields
    var fields = ['source', 'type'].concat(this._typeDef().parametersDataSchema.split(','));
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
        options: CONNECT_WITH_LINES.map(function (d) {
          return {
            val: d.type,
            label: d.label
          };
        }, this)
      },
      source_column: {
        type: 'Select',
        title: 'source',
        options: this._getColumnOptions('source_column', 'string'),
        validators: ['required']
      },
      target: {
        type: 'NodeDataset',
        title: _t('editor.layers.analysis-form.target'),
        options: this._getSourceOptionsForSource('target', '*'),
        validators: ['required']
      },
      target_column: {
        type: 'Select',
        title: 'Target column',
        options: this._getColumnOptions('source_column', 'geometry'),
        validators: ['required']
      },
      destination_longitude: {
        type: 'Text',
        title: _t('editor.layers.analysis-form.longitude'),
        validators: ['required'],
        editorAttrs: {
          placeholder: _t('editor.layers.analysis-form.enter-longitude')
        }
      },
      destination_latitude: {
        type: 'Text',
        title: _t('editor.layers.analysis-form.latitude'),
        validators: ['required'],
        editorAttrs: {
          placeholder: _t('editor.layers.analysis-form.enter-latitude')
        }
      },
      closest: {
        type: 'Radio',
        title: 'closest',
        options: [
          { label: _t('editor.layers.analysis-form.to-closest'), val: 'true' },
          { label: _t('editor.layers.analysis-form.all-to-all'), val: 'false' }
        ]
      },
      order: {
        type: 'Enabler',
        label: _t('editor.layers.analysis-form.order'),
        title: '',
        editorAttrs: {
          reversed: true
        }
      },
      order_column: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.order-by'),
        options: this._columnOptions.filterByType(['date', 'number'])
      },
      order_type: {
        type: 'Radio',
        title: _t('editor.layers.analysis-form.order'),
        options: [
          { label: _t('editor.layers.analysis-form.asc'), val: 'asc' },
          { label: _t('editor.layers.analysis-form.desc'), val: 'desc' }
        ]
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

  _isPrimarySource: function (sourceAttrName) {
    return sourceAttrName === this.get('primary_source_name');
  },

  _isFetchingOptions: function () {
    return this._analysisSourceOptionsModel.get('fetching');
  },
});
