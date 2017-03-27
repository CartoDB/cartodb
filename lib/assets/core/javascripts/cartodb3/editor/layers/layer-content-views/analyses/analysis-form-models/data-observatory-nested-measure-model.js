var Backbone = require('backbone');
var DataObservatoryNormalize = require('../../../../../data/data-observatory/normalize-collection');
var checkAndBuildOpts = require('../../../../../helpers/required-opts');

var REQUIRED_OPTS = [
  'regions',
  'form',
  'configModel',
  'layerDefinitionModel'
];

module.exports = Backbone.Model.extend({
  initialize: function (attrs, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this.normalize = new DataObservatoryNormalize(null, {
      configModel: this._configModel,
      layerDefinitionModel: this._layerDefinitionModel
    });

    this._initBinds();

    this._setSchema = this._setSchema.bind(this);
    this._setSchema();
  },

  _fetchRegionsError: function () {
    this._setSchema();
  },

  _initBinds: function () {
    this.listenTo(this._form.model, 'change:area', this._areaChanged);
    this.on('change:measurement', this._measurementChanged, this);
  },

  _areaChanged: function () {
    this._setSchema();
  },

  _measurementChanged: function () {
    this.normalize.fetch({
      success: this._setSchema,
      error: this._setSchema,
      measurement: this.get('measurement')
    });
  },

  // _normalizeSegment: function (s) {
  //   return s.replace(/\./g, '_', /\-/g, '_');
  // },

  // _setSegment: function () {
  //   var s = this.doMetadata.segment(this.get('area'), this.get('measurement'), this.get('segments'));
  //   if (s) {
  //     this.set('segment_name', s);
  //   }
  // },

  _getNormalizeOptions: function () {
    return this.normalize.models;
  },

  _setSchema: function () {
    var schema = {
      measurement: {
        type: 'DataObservatoryDropdown',
        title: _t('editor.layers.analysis-form.data-observatory.measurements.label'),
        editorAttrs: {
          layerDefinitionModel: this._layerDefinitionModel,
          configModel: this._configModel,
          region: this._regions,
          placeholder: _t('editor.layers.analysis-form.data-observatory.measurements.placeholder')
        },
        dialogMode: 'float'
      },
      normalize: {
        type: 'EnablerEditor',
        title: '',
        label: _t('editor.layers.analysis-form.data-observatory.normalize.label'),
        isDisabled: this.get('measurement') == null,
        editor: {
          type: 'Select',
          options: this._getNormalizeOptions(),
          dialogMode: 'float',
          editorAttrs: {
            showLabel: false
          }
        }
      }
    };

    this.schema = schema;
    this.trigger('updateSchema', this.schema);
  }

});
