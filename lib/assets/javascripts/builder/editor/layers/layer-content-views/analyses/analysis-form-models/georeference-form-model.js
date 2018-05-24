var _ = require('underscore');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./georeference-form.tpl');
var ColumnOptions = require('builder/editor/layers/layer-content-views/analyses/column-options');
var GEOREFERENCE_TYPES = require('./georeference-types');

var TYPE_TO_META_MAP = {};
GEOREFERENCE_TYPES.map(function (d) {
  TYPE_TO_META_MAP[d.type] = d;
});

var GEOREFERENCE_PLACEHOLDER = 'georeference-placeholder';

/**
 * Form model for a georeference analysis
 * It has a rather complicated schema, that depends on several data points and state.
 */
module.exports = BaseAnalysisFormModel.extend({
  parse: function (attrs) {
    return _.defaults(
      _.pick(attrs, 'id', 'source', 'context'), // maintain default attrs
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
    this.on('change:type change:context', this._onTypeChanged, this);

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
    return {
      parametersDataFields: this._typeDef().getParameters(this.get('context')),
      hasType: this.get('type') !== GEOREFERENCE_PLACEHOLDER
    };
  },

  _filterSchemaFieldsByType: function (schema) {
    // Always include the source field in addition to the type-specific fields
    // If the model has a context attribute it will be used to filter the fields
    var context = this.get('context');
    var fields = ['source', 'type'].concat(this._typeDef().getParameters(context).split(','));

    return _.pick(schema, fields);
  },

  validate: function () {
    // Return something so form can't be applied on the placeholder
    if (this.get('type') === GEOREFERENCE_PLACEHOLDER) return { type: 'required' };
    return BaseAnalysisFormModel.prototype.validate.call(this);
  },

  /*
  /**
   * @override {BaseAnalysisFormModel._setSchema}
   */
  _setSchema: function () {
    var hasPlaceholder = this.get('type') === GEOREFERENCE_PLACEHOLDER;
    BaseAnalysisFormModel.prototype._setSchema.call(this, this._filterSchemaFieldsByType({
      type: {
        type: 'SelectPlaceholder',
        title: _t('editor.layers.analysis-form.type'),
        options: _.compact(
          GEOREFERENCE_TYPES.map(function (d) {
            if (!this._analyses.isAnalysisValidByType(d.type, { configModel: this._configModel })) {
              return false;
            }

            return {
              hidden: d.type === GEOREFERENCE_PLACEHOLDER,
              val: d.type,
              label: d.label
            };
          }, this)
        ),
        dialogMode: 'float',
        forcePlaceholder: hasPlaceholder,
        placeholder: _t('editor.layers.analysis-form.select-type-placeholder')
      },
      context: {
        type: 'Toggle',
        title: '',
        label: '',
        options: [
          {
            val: 'advance',
            label: _t('editor.layers.analysis-form.georeference.advance'),
            help: _t('editor.layers.analysis-form.georeference.street-address-help'),
            selected: false
          }, {
            val: 'normal',
            label: _t('editor.layers.analysis-form.georeference.normal'),
            selected: true
          }
        ]
      },
      source: {
        type: 'NodeDataset',
        text: _t('editor.layers.analysis-form.base-layer'),
        options: this._getSourceOption(),
        dialogMode: 'float',
        editorAttrs: { disabled: true }
      },
      latitude: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.latitude'),
        options: this._columnOptions.filterByType('number'),
        dialogMode: 'float',
        validators: this._getFieldValidator('latitude'),
        placeholder: _t('editor.layers.analysis-form.georeference.select-latitude'),
        searchPlaceholder: _t('editor.layers.analysis-form.search-by-column-name')
      },
      longitude: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.longitude'),
        options: this._columnOptions.filterByType('number'),
        dialogMode: 'float',
        validators: this._getFieldValidator('longitude'),
        placeholder: _t('editor.layers.analysis-form.georeference.select-longitude'),
        searchPlaceholder: _t('editor.layers.analysis-form.search-by-column-name')
      },
      admin_region: {
        type: 'EnablerEditor',
        title: '',
        label: _t('editor.layers.analysis-form.admin-region'),
        help: _t('editor.layers.analysis-form.georeference.admin-region-extended-help'),
        validators: this._getFieldValidator('admin_region'),
        editor: {
          type: 'Select',
          options: this._getColumnOptions('admin_region', 'string'),
          dialogMode: 'float',
          editorAttrs: this._getFieldAttrs('admin_region'),
          placeholder: _t('editor.layers.analysis-form.georeference.select-admin'),
          searchPlaceholder: _t('editor.layers.analysis-form.georeference.enter-region-name')
        }
      },
      admin_region_column: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.admin-region'),
        options: this._columnOptions.filterByType('string'),
        dialogMode: 'float',
        help: _t('editor.layers.analysis-form.georeference.admin-region-help'),
        validators: this._getFieldValidator('admin_region'),
        editorAttrs: this._getFieldAttrs('admin_region'),
        placeholder: _t('editor.layers.analysis-form.georeference.select-admin'),
        searchPlaceholder: _t('editor.layers.analysis-form.search-by-column-name')
      },
      country_column: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.country'),
        options: this._columnOptions.filterByType('string'),
        dialogMode: 'float',
        help: _t('editor.layers.analysis-form.georeference.country-help'),
        validators: this._getFieldValidator('country_column'),
        editorAttrs: this._getFieldAttrs('country_column'),
        placeholder: _t('editor.layers.analysis-form.georeference.select-a-country'),
        searchPlaceholder: _t('editor.layers.analysis-form.search-by-column-name')
      },
      city: {
        type: 'EnablerEditor',
        title: '',
        label: _t('editor.layers.analysis-form.city'),
        help: _t('editor.layers.analysis-form.georeference.city-extended-help'),
        validators: this._getFieldValidator('city'),
        editor: {
          type: 'Select',
          options: this._getColumnOptions('city', 'string'),
          dialogMode: 'float',
          editorAttrs: this._getFieldAttrs('city'),
          placeholder: _t('editor.layers.analysis-form.georeference.select-city'),
          searchPlaceholder: _t('editor.layers.analysis-form.georeference.enter-city-name')
        }
      },
      city_column: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.city'),
        options: this._columnOptions.filterByType('string'),
        dialogMode: 'float',
        help: _t('editor.layers.analysis-form.georeference.city-help'),
        validators: this._getFieldValidator('city_column'),
        editorAttrs: this._getFieldAttrs('city_column'),
        placeholder: _t('editor.layers.analysis-form.georeference.select-city'),
        searchPlaceholder: _t('editor.layers.analysis-form.search-by-column-name')
      },
      postal_code_column: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.postal-code'),
        options: this._columnOptions.filterByType(['string', 'number']),
        dialogMode: 'float',
        help: _t('editor.layers.analysis-form.georeference.postal-code-help'),
        validators: this._getFieldValidator('postal_code_column'),
        placeholder: _t('editor.layers.analysis-form.georeference.select-postal-code'),
        searchPlaceholder: _t('editor.layers.analysis-form.search-by-column-name')
      },
      ip_address: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.georeference.ip-address-column'),
        options: this._columnOptions.filterByType('string'),
        dialogMode: 'float',
        help: _t('editor.layers.analysis-form.georeference.ip-address-help'),
        validators: this._getFieldValidator('ip_address'),
        placeholder: _t('editor.layers.analysis-form.georeference.select-ip'),
        searchPlaceholder: _t('editor.layers.analysis-form.search-by-column-name')
      },
      street_address_template: {
        type: 'CodeEditor',
        title: '',
        label: '',
        tokens: this._getColumnHints(this._columnOptions.filterByType(['string', 'number'])),
        validators: this._getFieldValidator('street_address_template'),
        placeholder: '{{street_number}} {{street_name}}, {{postal_code}} {{country}}'
      },
      street_address_column: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.georeference.street-address-column'),
        options: this._columnOptions.filterByType('string'),
        dialogMode: 'float',
        help: _t('editor.layers.analysis-form.georeference.street-address-column-help'),
        validators: this._getFieldValidator('street_address_column'),
        placeholder: _t('editor.layers.analysis-form.georeference.select-street-address'),
        searchPlaceholder: _t('editor.layers.analysis-form.search-by-column-name')
      },
      state: {
        type: 'EnablerEditor',
        title: '',
        label: _t('editor.layers.analysis-form.state'),
        help: _t('editor.layers.analysis-form.georeference.state-help'),
        validators: this._getFieldValidator('state'),
        editor: {
          type: 'Select',
          options: this._getColumnOptions('state', 'string'),
          dialogMode: 'float',
          editorAttrs: this._getFieldAttrs('state'),
          placeholder: _t('editor.layers.analysis-form.georeference.select-state'),
          searchPlaceholder: _t('editor.layers.analysis-form.georeference.enter-state-name')
        }
      },
      country: {
        type: 'EnablerEditor',
        title: '',
        label: _t('editor.layers.analysis-form.country'),
        help: _t('editor.layers.analysis-form.georeference.country-extended-help'),
        validators: this._getFieldValidator('country'),
        editor: {
          type: 'Select',
          options: this._getColumnOptions('country', 'string'),
          dialogMode: 'float',
          editorAttrs: this._getFieldAttrs('country'),
          placeholder: _t('editor.layers.analysis-form.georeference.select-country'),
          searchPlaceholder: _t('editor.layers.analysis-form.georeference.enter-country-name')
        }
      },
      postal_code_country: {
        type: 'Suggest',
        title: _t('editor.layers.analysis-form.country'),
        options: this._columnOptions.filterByType('string'),
        dialogMode: 'float',
        help: _t('editor.layers.analysis-form.georeference.country-extended-help'),
        validators: this._getFieldValidator('postal_code_country'),
        editorAttrs: this._getFieldAttrs('postal_code_country'),
        placeholder: _t('editor.layers.analysis-form.georeference.select-country'),
        searchPlaceholder: _t('editor.layers.analysis-form.georeference.enter-country-name')
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
    this.set({
      type: attrs.type,
      context: attrs.context
    }, { silent: true }); // re-set type to avoid change:type change:context event to trigger again
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

  _getColumnHints: function (columns) {
    if (!columns) {
      return [];
    }

    return [{
      keywords: columns.map(function (column) { return column.val; }).join(' '),
      type: 'Column_name'
    }];
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
