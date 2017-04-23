var _ = require('underscore');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./data-observatory-measure.tpl');
var templateList = require('./data-observatory-measure-list.tpl');
var templateItem = require('./data-observatory-measure-list-item.tpl');
var NestedMeasurement = require('./data-observatory-nested-measure-model');
var DataObservatoryRegions = require('../../../../../data/data-observatory/regions-collection');
var camshaftReference = require('../../../../../data/camshaft-reference');

module.exports = BaseAnalysisFormModel.extend({
  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    this.nodeDefModel = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.get('source'));

    this.regions = new DataObservatoryRegions(null, {
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

  validate: function () {
    // source"
    // final_column"
    // segment_name"
    // percent"

    var source = this.get('source');
    var type = this.get('type');
    var measurements = this.get('measurements');
    var errors = _.extend({}, this._formValidationErrors);

    _.each(measurements, function (measurement, index) {
      errors = _.extend(
        errors,
        camshaftReference.validate({
          type: type,
          source: source,
          segment_name: measurement.segment_name,
          final_column: '???' + index
        })
      );
    });

    if (!_.isEmpty(errors)) {
      return errors;
    }
  },

  _fetchRegionsError: function () {
    this._setSchema();
  },

  _initBinds: function () {
    this.listenTo(this.regions, 'sync', this._setSchema);
  },

  getTemplate: function () {
    return template;
  },

  _getRegionOptions: function () {
    var regions = this.regions;
    var state = regions.getState();
    if (state === 'error') {
      return _t('editor.layers.analysis-form.data-observatory.region.error');
    } else if (state === 'fetching') {
      return _t('editor.layers.analysis-form.loading');
    } else {
      // remove Global for the moment since it only includes Boundaries
      return regions.filter(function (f) { return f !== 'Global'; }).sort();
    }
  },

  /**
   * @override {BaseAnalysisFormModel._setSchema}
   */
  _setSchema: function () {
    var schema = {
      source: this._primarySourceSchemaItem(_t('editor.layers.analysis-form.data-observatory.source.label')),
      area: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.data-observatory.region.label'),
        options: this._getRegionOptions(),
        dialogMode: 'float',
        editorAttrs: {
          disabled: this.regions.length === 0
        }
      },
      measurements: {
        type: 'List',
        itemType: 'MeasurementModel',
        model: NestedMeasurement,
        listTemplate: templateList,
        itemTemplate: templateItem,
        title: '',
        editorAttrs: {
          layerDefinitionModel: this._layerDefinitionModel,
          configModel: this._configModel,
          regions: this.regions
        }
      }
    };

    BaseAnalysisFormModel.prototype._setSchema.call(this, schema);
  }

});
