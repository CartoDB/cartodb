var _ = require('underscore');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./data-observatory-multiple-measure.tpl');
var templateList = require('./data-observatory-multiple-measure-list.tpl');
var templateItem = require('./data-observatory-multiple-measure-list-item.tpl');
var NestedMeasurement = require('./data-observatory-multiple-nested-measure-model');
var DataObservatoryRegions = require('../../../../../data/data-observatory/regions-collection');
var camshaftReference = require('../../../../../data/camshaft-reference');
var itemRegionListTemplate = require('./data-observatory-multiple-region-list-item.tpl');

module.exports = BaseAnalysisFormModel.extend({
  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    this.nodeDefModel = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.get('source'));

    this.regions = new DataObservatoryRegions(null, {
      configModel: this._configModel,
      nodeDefModel: this.nodeDefModel
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

  parse: function (attributes) {
    var numerators = attributes.numerators;
    var column_names = attributes.column_names;

    var measurements = _.reduce(numerators, function (memo, numerator, index) {
      memo.push({
        segment_name: numerator,
        column_name: column_names[index]
      });
      return memo;
    }, []);

    return _.extend(_.omit(attributes, 'numerators', 'column_names'), {
      measurements: measurements
    });
  },

  _formatAttrs: function (formAttrs) {
    var numerators = this._getNumerators();
    var columnNames = this._getColumnNames();

    var attributes = _.extend(
      {},
      _.omit(formAttrs, 'measurements'),
      {
        numerators: numerators,
        column_names: columnNames
      }
    );

    return _.omit(camshaftReference.parse(attributes), 'persisted');
  },

  validate: function () {
    var source = this.get('source');
    var type = this.get('type');
    var numerators = this._getNumerators();
    var columnNames = this._getColumnNames();

    var errors = _.extend(
      this._validateMatchSegmentsColumnNames(numerators, columnNames),
      this._isCollectionValid(numerators),
      this._isCollectionValid(columnNames),
      camshaftReference.validate({
        source: source,
        type: type,
        numerators: numerators,
        column_names: columnNames
      }),
      this._formValidationErrors
    );

    if (!_.isEmpty(errors)) {
      return errors;
    }
  },

  _getNumerators: function () {
    var measurements = this.get('measurements');
    return _.map(measurements, function (measurement) {
      return measurement.segment_name;
    });
  },

  _getColumnNames: function () {
    var measurements = this.get('measurements');
    return _.map(measurements, function (measurement) {
      return measurement.column_name;
    });
  },

  _validateMatchSegmentsColumnNames: function (segments, columnNames) {
    if (segments.length === 0 || segments.length !== columnNames.length) {
      return {
        error: true
      };
    }
  },

  _isCollectionValid: function (collection) {
    var allFilled = _.every(collection, function (item) {
      return item !== '';
    });

    if (!allFilled) {
      return {
        error: true
      };
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
      return regions.filter(function (f) { return f !== '"Global"'; }).sort();
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
        itemListTemplate: itemRegionListTemplate,
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
          configModel: this._configModel,
          regions: this.regions,
          nodeDefModel: this.nodeDefModel
        }
      }
    };

    BaseAnalysisFormModel.prototype._setSchema.call(this, schema);
  }

});
