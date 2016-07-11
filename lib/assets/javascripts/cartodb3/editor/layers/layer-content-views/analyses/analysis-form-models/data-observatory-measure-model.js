var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./data-observatory-measure.tpl');
var DataObservartoryMetadata = require('../data-observatory-metadata');

module.exports = BaseAnalysisFormModel.extend({
  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);
    this.doMetadata = new DataObservartoryMetadata(null, {
      configModel: this._configModel
    });
    this.listenTo(this.doMetadata, 'sync', this._setSchema);
    this.doMetadata.fetch();

    this.on('change:area', this._areaChanged, this);
    this.on('change:measurement', this._measurementChanged, this);
    this.on('change:segments', this._setSegment, this);
    this._setSchema();
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
      // this code changes the column name automatically
      // if (this.get('final_column') === '') {
      // this.set('final_column', this._normalizeSegment(s));
      // this._setSchema();
      // }
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
        options: this.doMetadata.measurement(this.get('area')).sort()
      },
      segments: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.data-observatory-measurement-segments'),
        options: this.doMetadata.columns(this.get('area'), this.get('measurement')).sort()
      }
    };

    BaseAnalysisFormModel.prototype._setSchema.call(this, schema);
  }

});
