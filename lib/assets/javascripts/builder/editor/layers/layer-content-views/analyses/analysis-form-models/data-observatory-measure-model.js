var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./data-observatory-measure.tpl');
var DataObservartoryMetadata = require('builder/editor/layers/layer-content-views/analyses/data-observatory-metadata');
var Utils = require('builder/helpers/utils');

module.exports = BaseAnalysisFormModel.extend({
  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    this.nodeDefModel = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.get('source'));

    this.doMetadata = new DataObservartoryMetadata(null, {
      configModel: this._configModel,
      geometryType: null
    });

    // check if the geometry type is available, if not wait until it's finished
    if (this.nodeDefModel.queryGeometryModel.isFetched()) {
      this._fetchDOMetadata();
    } else {
      this.nodeDefModel.queryGeometryModel.once('change:status', this._fetchDOMetadata, this);
    }
    this._setSchema();
  },

  _formatAttrs: function (formAttrs) {
    formAttrs.final_column = Utils.sanitizeString(formAttrs.final_column);
    return BaseAnalysisFormModel.prototype._formatAttrs.call(this, formAttrs);
  },

  _fetchDOMetadata: function () {
    var simpleGeometryType = this.nodeDefModel.queryGeometryModel.get('simple_geom') || 'point';
    this.doMetadata.setGeometryType(simpleGeometryType);
    this.listenTo(this.doMetadata, 'sync', this._setSchema);
    this.on('change:area', this._areaChanged, this);
    this.on('change:measurement', this._measurementChanged, this);
    this.on('change:segments', this._setSegment, this);
    this.doMetadata.fetch();
  },

  _areaChanged: function () {
    this.set({ measurement: '', segments: '' }, { silent: true });
    this._setSchema();
  },

  _measurementChanged: function () {
    this.set({ segments: '' }, { silent: true });
    this._setSchema();
  },

  _normalizeSegment: function (s) {
    return s.replace(/\./g, '_', /\-/g, '_');
  },

  _setSegment: function () {
    var s = this.doMetadata.segment(this.get('area'), this.get('measurement'), this.get('segments'));
    if (s) {
      this.set('segment_name', s);
    }
  },

  getTemplate: function () {
    return template;
  },

  /**
   * @override {BaseAnalysisFormModel._setSchema}
   */
  _setSchema: function () {
    var areas = this.doMetadata.areas();
    var schema = {
      source: this._primarySourceSchemaItem(),
      area: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.data-observatory-measurement-area'),
        // remove Global for the moment since it only includes Boundaries
        options: areas.length === 0 ? _t('editor.layers.analysis-form.loading') : areas.filter(function (f) { return f !== 'Global'; }).sort(),
        dialogMode: 'float',
        editorAttrs: {
          disabled: areas.length === 0
        }
      },
      final_column: {
        title: _t('editor.layers.analysis-form.data-observatory-measurement-column'),
        type: 'Text',
        help: _t('editor.layers.analysis-form.data-observatory-measurement-column-help'),
        validators: ['required']
      },
      measurement: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.data-observatory-measurement-measurement'),
        options: this.doMetadata.measurement(this.get('area')).sort(),
        dialogMode: 'float'
      },
      segments: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.data-observatory-measurement-segments'),
        options: this.doMetadata.columns(this.get('area'), this.get('measurement')).sort(),
        dialogMode: 'float'
      }
    };

    BaseAnalysisFormModel.prototype._setSchema.call(this, schema);
  }
});
