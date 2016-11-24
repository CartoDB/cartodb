var _ = require('underscore');

var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./georeference-form.tpl');
var ColumnOptions = require('../column-options');
var GEOREFERENCE_TYPES = require('./georeference-types');

var TYPE_TO_META_MAP = {};
GEOREFERENCE_TYPES.map(function (d) {
  TYPE_TO_META_MAP[d.type] = d;
});

/**
 * Form model for a georeference analysis
 * It has a rather complicated schema, that depends on several data points and state.
 */
module.exports = BaseAnalysisFormModel.extend({
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

    this._setSchema();
  },

  updateNodeDefinition: function (nodeDefModel) {
    var attrs = this._formatAttrs(this.attributes);
    nodeDefModel.clear({silent: true});
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
    return {parametersDataFields: this._typeDef().parametersDataFields};
  },

  _filterSchemaFieldsByType: function (schema) {
    // Always include the source field in addition to the type-specific fields
    var fields = ['source', 'type'].concat(this._typeDef().parametersDataFields.split(','));
    return _.pick(schema, fields);
  },

  /*
  /**
   * @override {BaseAnalysisFormModel._setSchema}
   */
  _setSchema: function () {
    BaseAnalysisFormModel.prototype._setSchema.call(this, this._filterSchemaFieldsByType({
      type: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.type'),
        options: _.compact(
          GEOREFERENCE_TYPES.map(function (d) {
            if (!this._analyses.isAnalysisValidByType(d.type, this._userModel, this._configModel)) {
              return false;
            }

            return {
              val: d.type,
              label: d.label
            };
          }, this)
        )
      },
      source: {
        type: 'NodeDataset',
        text: _t('editor.layers.analysis-form.source'),
        options: this._getSourceOption(),
        editorAttrs: { disabled: true }
      },
      latitude: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.latitude'),
        options: this._columnOptions.filterByType(['string', 'number']),
        validators: this._getFieldValidator('latitude')
      },
      longitude: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.longitude'),
        options: this._columnOptions.filterByType(['string', 'number']),
        validators: this._getFieldValidator('longitude')
      },
      admin_region: {
        type: 'EnablerEditor',
        title: '',
        label: _t('editor.layers.analysis-form.admin-region'),
        help: _t('editor.layers.analysis-form.admin-region-help'),
        validators: this._getFieldValidator('admin_region'),
        editor: {
          type: 'Select',
          options: this._getColumnOptions('admin_region', 'string'),
          editorAttrs: this._getFieldAttrs('admin_region')
        }
      },
      admin_region_column: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.admin-region'),
        options: this._columnOptions.filterByType('string'),
        help: _t('editor.layers.analysis-form.admin-region-help'),
        validators: this._getFieldValidator('admin_region'),
        editorAttrs: this._getFieldAttrs('admin_region')
      },
      country_column: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.country'),
        options: this._columnOptions.filterByType('string'),
        help: _t('editor.layers.analysis-form.country-help'),
        validators: this._getFieldValidator('country_column'),
        editorAttrs: this._getFieldAttrs('country_column')
      },
      city: {
        type: 'EnablerEditor',
        title: '',
        label: _t('editor.layers.analysis-form.city'),
        help: _t('editor.layers.analysis-form.city-help'),
        validators: this._getFieldValidator('city'),
        editor: {
          type: 'Select',
          options: this._getColumnOptions('city', 'string'),
          editorAttrs: this._getFieldAttrs('city')
        }
      },
      city_column: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.city'),
        options: this._columnOptions.filterByType('string'),
        help: _t('editor.layers.analysis-form.city-help'),
        validators: this._getFieldValidator('city_column'),
        editorAttrs: this._getFieldAttrs('city_column')
      },
      postal_code_column: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.postal-code'),
        options: this._columnOptions.filterByType(['string', 'number']),
        help: _t('editor.layers.analysis-form.postal-code-help'),
        validators: this._getFieldValidator('postal_code_column')
      },
      ip_address: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.ip-address'),
        options: this._columnOptions.filterByType('string'),
        help: _t('editor.layers.analysis-form.ip-address-help'),
        validators: this._getFieldValidator('ip_address')
      },
      street_address_column: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.street-address'),
        options: this._columnOptions.filterByType('string'),
        help: _t('editor.layers.analysis-form.street-address-help'),
        validators: this._getFieldValidator('street_address_column')
      },
      state: {
        type: 'EnablerEditor',
        title: '',
        label: _t('editor.layers.analysis-form.state'),
        help: _t('editor.layers.analysis-form.state-help'),
        validators: this._getFieldValidator('state'),
        editor: {
          type: 'Select',
          options: this._getColumnOptions('state', 'string'),
          editorAttrs: this._getFieldAttrs('state')
        }
      },
      country: {
        type: 'EnablerEditor',
        title: '',
        label: _t('editor.layers.analysis-form.country'),
        help: _t('editor.layers.analysis-form.country-help'),
        validators: this._getFieldValidator('country'),
        editor: {
          type: 'Select',
          options: this._getColumnOptions('country', 'string'),
          editorAttrs: this._getFieldAttrs('country')
        }
      }
    }));
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
  },

  _getFieldAttrs: function (fieldName) {
    return this._typeDef() && this._typeDef().fieldAttrs[fieldName];
  },

  _getFieldValidator: function (fieldName) {
    return this._typeDef() && this._typeDef().validatorFor[fieldName] || null;
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
  }
});
