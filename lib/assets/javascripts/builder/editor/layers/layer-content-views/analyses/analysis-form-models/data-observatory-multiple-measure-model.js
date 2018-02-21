var _ = require('underscore');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./data-observatory-multiple-measure.tpl');
var templateList = require('./data-observatory-multiple-measure-list.tpl');
var templateItem = require('./data-observatory-multiple-measure-list-item.tpl');
var NestedMeasurement = require('./data-observatory-multiple-nested-measure-model');
var DataObservatoryRegions = require('builder/data/data-observatory/regions-collection');
var camshaftReference = require('builder/data/camshaft-reference');
var itemRegionListTemplate = require('./data-observatory-multiple-region-list-item.tpl');

var DENOMINATORS_BLACKLIST = ['', 'area'];

var EMPTY_AREA = ' ';

module.exports = BaseAnalysisFormModel.extend({
  defaults: {
    'area': EMPTY_AREA
  },

  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    this.nodeDefModel = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.get('source'));

    this.regions = new DataObservatoryRegions(null, {
      configModel: this._configModel,
      nodeDefModel: this.nodeDefModel
    });

    this._initBinds();

    this._setSchema = this._setSchema.bind(this);
    this._setSchema();

    this.regions.fetch();
  },

  parse: function (attributes) {
    var ATTRIBUTES = ['numerators', 'column_names', 'denominators', 'numerator_timespans', 'geom_ids', 'normalizations'];

    var numerators = attributes.numerators;
    var column_names = attributes.column_names;
    var denominators = attributes.denominators;
    var normalizations = attributes.normalizations;
    var timespans = attributes.numerator_timespans;
    var geom_ids = attributes.geom_ids;

    var measurements = _.reduce(numerators, function (memo, numerator, index) {
      memo.push({
        segment_name: numerator,
        column_name: column_names[index],
        normalize: denominators[index],
        timespan: timespans[index],
        boundaries: geom_ids[index],
        normalization: normalizations[index]
      });
      return memo;
    }, []);

    return _.extend(_.omit(attributes, ATTRIBUTES), {
      measurements: measurements
    });
  },

  getTemplate: function () {
    return template;
  },

  getTemplateData: function () {
    var fields = [];
    var data = {
      fields: '',
      hasArea: this.get('area') !== EMPTY_AREA
    };

    // Don't show measurements until user selects a region
    if (this.get('area')) {
      fields.push('measurements');
    }

    data.fields = fields.join(',');
    return data;
  },

  _formatAttrs: function (formAttrs) {
    var numerators = this._getNumerators();
    var columnNames = this._getColumnNames();
    var normalizers = this._getDenominators();
    var normalization = this._getNormalization();
    var timespans = this._getTimespan();
    var boundaries = this._getBoundaries();

    var attributes = _.extend(
      {},
      _.omit(formAttrs, 'measurements'),
      {
        numerators: numerators,
        column_names: columnNames,
        denominators: normalizers,
        normalizations: normalization,
        numerator_timespans: timespans,
        geom_ids: boundaries
      }
    );

    return _.omit(camshaftReference.parse(attributes), 'persisted');
  },

  validate: function () {
    var source = this.get('source');
    var type = this.get('type');
    var region = this.get('area');
    var numerators = this._getNumerators();
    var columnNames = this._getColumnNames();
    var normalizers = this._getDenominators();
    var normalizations = this._getNormalization();
    var timespans = this._getTimespan();
    var boundaries = this._getBoundaries();

    var errors = _.extend(
      {},
      this._validRegion(region),
      this._validateMatchSegmentsColumnNames(numerators, columnNames),
      this._isCollectionValid(numerators),
      this._isCollectionValid(columnNames),
      this._areUniqueMeasurements(columnNames),
      camshaftReference.validate({
        source: source,
        type: type,
        numerators: numerators,
        column_names: columnNames,
        denominators: normalizers,
        normalizations: normalizations,
        numerator_timespans: timespans,
        geom_ids: boundaries
      }),
      this._formValidationErrors
    );

    if (!_.isEmpty(errors)) {
      return errors;
    }
  },

  // DRY
  _getNumerators: function () {
    var measurements = this.get('measurements');
    return _.map(measurements, function (measurement) {
      return measurement.segment_name;
    });
  },

  _getTimespan: function () {
    var measurements = this.get('measurements');
    return _.map(measurements, function (measurement) {
      return measurement.timespan;
    });
  },

  _getBoundaries: function () {
    var measurements = this.get('measurements');
    return _.map(measurements, function (measurement) {
      return measurement.boundaries;
    });
  },

  _getNormalization: function () {
    var measurements = this.get('measurements');
    return _.map(measurements, function (measurement) {
      return measurement.normalization;
    });
  },

  _getDenominators: function () {
    var measurements = this.get('measurements');
    return _.map(measurements, function (measurement) {
      var normalize = measurement.normalize;
      // We are inserting area option manually, so we need to filter that value for the backend
      normalize = (DENOMINATORS_BLACKLIST.indexOf(normalize) >= 0) ? null : normalize;
      return normalize;
    });
  },

  _getColumnNames: function () {
    var measurements = this.get('measurements');
    return _.map(measurements, function (measurement) {
      return measurement.column_name;
    });
  },

  _validRegion: function (region) {
    if (region == null) {
      return {
        error: true,
        message: _t('analyses.data-observatory-measure.errors.mandatory-region')
      };
    }
  },

  _validateMatchSegmentsColumnNames: function (segments, columnNames) {
    if (segments.length !== 0 && columnNames.length !== 0 && segments.length !== columnNames.length) {
      return {
        error: true,
        message: _t('analyses.data-observatory-measure.errors.column-name-mismatch')
      };
    }
  },

  _isCollectionValid: function (collection) {
    var allFilled = _.every(collection, function (item) {
      return item && item !== '';
    });

    if (!allFilled) {
      return {
        error: true,
        message: _t('analyses.data-observatory-measure.errors.invalid-selection')
      };
    }
  },

  _areUniqueMeasurements: function (columnNames) {
    var uniques = _.unique(columnNames);
    if (!_.isEqual(uniques, columnNames)) {
      return {
        error: true,
        message: _t('analyses.data-observatory-measure.errors.measurement-twice')
      };
    }
  },

  _initBinds: function () {
    this.on('change:area', this._setSchema, this);
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
      return regions.filter(function (f) {
        var matches = /^Global/.test(f.get('label'));
        return !matches;
      }).sort();
    }
  },

  /**
   * @override {BaseAnalysisFormModel._setSchema}
   */
  _setSchema: function () {
    var schema = {
      source: this._primarySourceSchemaItem(_t('editor.layers.analysis-form.data-observatory.source.label')),
      area: {
        type: 'SelectPlaceholder',
        title: _t('editor.layers.analysis-form.data-observatory.region.label'),
        collection: this.regions,
        dialogMode: 'float',
        loading: this.regions.stateModel.get('state') === 'fetching',
        itemListTemplate: itemRegionListTemplate,
        validators: ['required'],
        placeholder: _t('editor.layers.analysis-form.data-observatory.region.placeholder'),
        searchPlaceholder: _t('editor.layers.analysis-form.data-observatory.region.search-placeholder'),
        forcePlaceholder: this.get('area') === EMPTY_AREA
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
          nodeDefModel: this.nodeDefModel,
          maxItems: 10,
          notAddItemByDefault: true
        },
        validators: [ function (value, formValues) {
          var hasError = value.segment_name == null || value.segment_name === '';
          if (hasError) {
            return {
              error: true,
              message: _t('analyses.data-observatory-measure.errors.measurement-required')
            };
          }

          return null;
        } ]
      }
    };

    BaseAnalysisFormModel.prototype._setSchema.call(this, schema);
  }

});
