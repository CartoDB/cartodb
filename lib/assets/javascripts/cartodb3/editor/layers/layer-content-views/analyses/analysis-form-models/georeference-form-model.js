var _ = require('underscore');

var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./georeference-form.tpl');
var ColumnOptions = require('../column-options');

var FIELD_VALIDATORS = {
  'georeference-long-lat': {
    latitude: ['required'],
    longitude: ['required']
  },
  'georeference-city': {
    city: ['required'],
    admin_region: ['required'],
    country: ['required']
  },
  'georeference-admin-region': {
    admin_region: ['required'],
    country: ['required']
  },
  'georeference-postal-code': {
    postal_code: ['required'],
    country: ['required']
  },
  'georeference-ip-address': {
    ip_address: ['required']
  },
  'georeference-street-address': {
    street_address: ['required'],
    city: null,
    state: null,
    country: null
  }
};

var FIELDS_FOR_TYPE = {
  'georeference-long-lat': 'latitude,longitude',
  'georeference-city': 'city,admin_region,country',
  'georeference-admin-region': 'admin_region,country',
  'georeference-postal-code': 'postal_code,country',
  'georeference-ip-address': 'ip_address',
  'georeference-street-address': 'street_address,city,state,country'
};

/**
 * Form model for a georeference analysis
 * It has a rather complicated schema, that depends on several data points and state.
 */
module.exports = BaseAnalysisFormModel.extend({
  parse: function (attrs) {
    return attrs;
  },

  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    this._columnOptions = new ColumnOptions({}, {
      configModel: this._configModel,
      nodeDefModel: this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.get('source'))
    });

    this.listenTo(this._columnOptions, 'columnsFetched', this._setSchema);
    this.on('change:type', this._setSchema, this);

    this._setSchema();
  },

  _updateNodeDefinition: function (nodeDefModel) {
    var attrs = this._formatAttrs(this.attributes);
    nodeDefModel.clear({silent: true});
    nodeDefModel.set(attrs);
  },

  _getFormatFieldNames: function () {
    return FIELDS_FOR_TYPE[this.get('type')];
  },

  _formatAttrs: function (formAttrs) {
    var customFormattedFormAttrs = _.pick(formAttrs, ['id', 'source', 'type'].concat(this._getFormatFieldNames().split(',')));

    return BaseAnalysisFormModel.prototype._formatAttrs.call(this, customFormattedFormAttrs);
  },

  getTemplate: function () {
    return template;
  },

  getTemplateData: function () {
    return {
      parametersDataFields: this._getFormFieldNames()
    };
  },

  _getFormFieldNames: function () {
    return FIELDS_FOR_TYPE[this.get('type')];
  },

  _filterSchemaFieldsByType: function (schema) { // Always include the source and target fields in addition to the type-specific fields
    return _.pick(schema, ['source', 'type'].concat(this._getFormFieldNames().split(',')));
  },

  /*
  /**
   * @override {BaseAnalysisFormModel._setSchema}
   */
  _setSchema: function () {
    BaseAnalysisFormModel.prototype._setSchema.call(this, this._filterSchemaFieldsByType({
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
        type: 'Select',
        title: _t('editor.layers.analysis-form.admin-region'),
        options: this._columnOptions.filterByType('string'),
        help: _t('editor.layers.analysis-form.admin-region-help'),
        validators: this._getFieldValidator('admin_region')
      },
      city: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.city'),
        options: this._columnOptions.filterByType('string'),
        help: _t('editor.layers.analysis-form.city-help'),
        validators: this._getFieldValidator('city')
      },
      postal_code: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.postal-code'),
        options: this._columnOptions.filterByType(['string', 'number']),
        help: _t('editor.layers.analysis-form.postal-code-help'),
        validators: this._getFieldValidator('postal_code')
      },
      ip_address: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.ip-address'),
        options: this._columnOptions.filterByType('string'),
        help: _t('editor.layers.analysis-form.ip-address-help'),
        validators: this._getFieldValidator('ip_address')
      },
      street_address: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.street-address'),
        options: this._columnOptions.filterByType('string'),
        help: _t('editor.layers.analysis-form.street-address-help'),
        validators: this._getFieldValidator('street_address')
      },
      state: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.state'),
        options: this._columnOptions.filterByType('string'),
        help: _t('editor.layers.analysis-form.state-help'),
        validators: this._getFieldValidator('state')
      },
      country: {
        type: 'Select',
        options: this._columnOptions.filterByType('string'),
        title: _t('editor.layers.analysis-form.country'),
        help: _t('editor.layers.analysis-form.country-help'),
        validators: this._getFieldValidator('country')
      },
      type: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.mode'),
        options: [
          { val: 'georeference-long-lat', label: _t('editor.layers.analysis-form.georeference-long-lat') },
          { val: 'georeference-city', label: _t('editor.layers.analysis-form.georeference-city') },
          { val: 'georeference-admin-region', label: _t('editor.layers.analysis-form.georeference-admin-region') },
          { val: 'georeference-postal-code', label: _t('editor.layers.analysis-form.georeference-postal-code') },
          { val: 'georeference-ip-address', label: _t('editor.layers.analysis-form.georeference-ip-address') },
          { val: 'georeference-street-address', label: _t('editor.layers.analysis-form.georeference-street-address') }
        ]
      }
    }));
  },

  _getFieldValidator: function (fieldName) {
    return FIELD_VALIDATORS[this.get('type')][fieldName];
  }
});
