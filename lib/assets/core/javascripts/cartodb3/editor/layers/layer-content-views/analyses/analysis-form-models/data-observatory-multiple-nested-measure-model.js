var Backbone = require('backbone');
var _ = require('underscore');
var DataObservatoryNormalize = require('../../../../../data/data-observatory/normalize-collection');
var DataObservatoryTimespan = require('../../../../../data/data-observatory/timespan-collection');
var DataObservatoryBoundaries = require('../../../../../data/data-observatory/boundaries-collection');
var DataObservatoryColumnName = require('../../../../../data/data-observatory/column-name');
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

    var fetchOptions = {
      configModel: this._configModel,
      layerDefinitionModel: this._layerDefinitionModel
    };

    this.normalize = new DataObservatoryNormalize(null, fetchOptions);
    this.timespan = new DataObservatoryTimespan(null, fetchOptions);
    this.boundaries = new DataObservatoryBoundaries(null, fetchOptions);
    DataObservatoryColumnName.initialize(fetchOptions);

    this._initBinds();

    this._setSchema = this._setSchema.bind(this);
    this._setSchema();

    this._columnNameSuccess = this._columnNameSuccess.bind(this);
  },

  _fetchRegionsError: function () {
    this._setSchema();
  },

  _columnNameSuccess: function (data) {
    console.log(data.rows[0].obs_getmeta[0].suggested_name);
    this.set('columnName', data.rows[0].obs_getmeta[0].suggested_name);
  },

  _getColumnNameOptions: function () {
    var defaults = {
      numer_id: null,
      // normalization: this.get('normalize') == null ? 'prenormalized' : 'denominated',
      denom_id: null,
      numer_timespan: null
    };

    var columnOptions = _.defaults({
      numer_id: this.get('segment_name'),
      denom_id: this.get('normalize') || null,
      numer_timespan: this.get('timespan') || null
    }, defaults);

    return _.extend(
      {
        success: this._columnNameSuccess
      },
      _.pick(columnOptions, _.identity)
    );
  },

  _getFetchOptions: function () {
    return _.extend(
      {
        success: this._setSchema,
        error: this._setSchema
      },
      this._getUserSelection()
    );
  },

  _initBinds: function () {
    this.listenTo(this._form.model, 'change:area', this._areaChanged);
    this.on('change:segment_name', this._measurementChanged, this);
    this.on('change:normalize', this._normalizeChanged, this);
    this.on('change:timespan', this._timestampChanged, this);
  },

  _areaChanged: function () {
    var measurement = this.get('segment_name');

    // If measurement is set, we fetch all collections
    if (measurement) {
      this._measurementChanged();
    }
  },

  _wrap: function (value) {
    var result = "'" + value + "'";
    return value ? result : null;
  },

  _measurementChanged: function (mdl, measure) {
    var fetchOptions = this._getFetchOptions();
    var columnOptions = this._getColumnNameOptions();

    this.normalize.fetch(fetchOptions);
    this.timespan.fetch(fetchOptions);
    this.boundaries.fetch(fetchOptions);
    DataObservatoryColumnName.fetch(columnOptions);
  },

  _normalizeChanged: function () {
    var fetchOptions = this._getFetchOptions();
    var columnOptions = this._getColumnNameOptions();

    this.timespan.fetch(fetchOptions);
    this.boundaries.fetch(fetchOptions);
    DataObservatoryColumnName.fetch(columnOptions);
  },

  _timestampChanged: function () {
    var fetchOptions = this._getFetchOptions();
    var columnOptions = this._getColumnNameOptions();

    this.boundaries.fetch(fetchOptions);
    DataObservatoryColumnName.fetch(columnOptions);
  },

  _getNormalizeOptions: function () {
    return this.normalize.models;
  },

  _getTimespanOptions: function () {
    return this.timespan.models;
  },

  _getUserSelection: function () {
    var normalize = this.get('normalize');
    normalize = normalize === '' ? null : this._wrap(normalize);

    var timespan = this.get('timespan');
    timespan = timespan != null ? this._wrap(timespan) : null;

    var region = this._wrap(this._form.model.get('area'));
    var measurement = this._wrap(this.get('segment_name'));

    return {
      region: region,
      measurement: measurement,
      normalize: normalize,
      timespan: timespan
    };
  },

  _setSchema: function () {
    var schema = {
      segment_name: {
        type: 'DataObservatoryDropdown',
        title: _t('editor.layers.analysis-form.data-observatory.measurements.label'),
        editorAttrs: {
          layerDefinitionModel: this._layerDefinitionModel,
          configModel: this._configModel,
          model: this._form.model,
          placeholder: _t('editor.layers.analysis-form.data-observatory.measurements.placeholder')
        },
        dialogMode: 'float',
        region: this._form.model.get('area'),
        validators: ['required']
      },
      normalize: {
        type: 'EnablerEditor',
        title: '',
        label: _t('editor.layers.analysis-form.data-observatory.normalize.label'),
        isDisabled: this.get('segment_name') == null,
        editor: {
          type: 'Select',
          options: this._getNormalizeOptions(),
          dialogMode: 'float',
          editorAttrs: {
            showSearch: false,
            showLabel: false
          }
        }
      },
      timespan: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.data-observatory.timespan.label'),
        options: this._getTimespanOptions(),
        dialogMode: 'float',
        editorAttrs: {
          placeholder: _t('editor.layers.analysis-form.data-observatory.timespan.placeholder')
        }
      },
      boundaries: {
        type: 'Slider',
        title: _t('editor.layers.analysis-form.data-observatory.boundaries.label'),
        direction: 'asc',
        values: this.boundaries.getValues(),
        labels: this.boundaries.getLabels()
      }
    };

    this.schema = schema;
    this.trigger('updateSchema', this.schema);
  }

});
