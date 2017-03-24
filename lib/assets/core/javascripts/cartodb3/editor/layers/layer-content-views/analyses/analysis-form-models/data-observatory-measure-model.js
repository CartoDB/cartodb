var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./data-observatory-measure.tpl');
var DataObservatoryRegions = require('../../../../../data/data-observatory/regions-collection');
var DataObservatoryNormalize = require('../../../../../data/data-observatory/normalize-collection');
var Utils = require('../../../../../helpers/utils');

module.exports = BaseAnalysisFormModel.extend({
  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    this.nodeDefModel = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.get('source'));

    this.regions = new DataObservatoryRegions(null, {
      configModel: this._configModel,
      layerDefinitionModel: this._layerDefinitionModel
    });

    this.normalize = new DataObservatoryNormalize(null, {
      configModel: this._configModel,
      layerDefinitionModel: this._layerDefinitionModel
    });

    this._initBinds();

    this._setSchema = this._setSchema.bind(this);
    // check if the geometry type is available, if not wait until it's finished
    if (this.nodeDefModel.queryGeometryModel.isFetched()) {
      this.regions.fetch({
        success: this._setSchema,
        error: this._setSchema
      });
    } else {
      this.nodeDefModel.queryGeometryModel.once('change:status', this._fetchRegions, this);
    }
    this._setSchema();
  },

  _fetchRegionsError: function () {
    this._setSchema();
  },

  _formatAttrs: function (formAttrs) {
    formAttrs.final_column = Utils.sanitizeString(formAttrs.final_column);
    return BaseAnalysisFormModel.prototype._formatAttrs.call(this, formAttrs);
  },

  _initBinds: function () {
    this.listenTo(this.regions, 'sync', this._setSchema);
    this.on('change:measurement', this._measurementChanged, this);
    // this.on('change:segments', this._setSegment, this);
  },

  // _areaChanged: function () {
  //   this.set({ measurement: '', segments: '' }, { silent: true });
  //   this._setSchema();
  // },

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

  getTemplate: function () {
    return template;
  },

  _getRegionOptions: function () {
    var regions = this.regions;
    var state = regions.getState();
    if (state === 'error') {
      return _t('editor.layers.analysis-form.data-observatory.regions.error');
    } else if (state === 'fetching') {
      return _t('editor.layers.analysis-form.loading');
    } else {
      // remove Global for the moment since it only includes Boundaries
      return regions.filter(function (f) { return f !== 'Global'; }).sort();
    }
  },

  _getNormalizeOptions: function () {
    return this.normalize.models;
  },

  /**
   * @override {BaseAnalysisFormModel._setSchema}
   */
  _setSchema: function () {
    var schema = {
      source: this._primarySourceSchemaItem(),
      area: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.data-observatory-measurement-area'),
        options: this._getRegionOptions(),
        dialogMode: 'float',
        editorAttrs: {
          disabled: this.regions.length === 0
        }
      },
      measurement: {
        type: 'DataObservatoryDropdown',
        title: _t('editor.layers.analysis-form.data-observatory.measurements.label'),
        editorAttrs: {
          layerDefinitionModel: this._layerDefinitionModel,
          configModel: this._configModel,
          region: this.regions,
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

    // we avoid to call _setSchema's parent to not trigger 'changeSchema' event
    // this event causes a new instantiation of the whole form
    this.schema = schema;
  }

});
