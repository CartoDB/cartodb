var Backbone = require('backbone');
var _ = require('underscore');
var DataObservatoryNormalize = require('../../../../../data/data-observatory/normalize-collection');
var DataObservatoryTimespan = require('../../../../../data/data-observatory/timespan-collection');
var DataObservatoryBoundaries = require('../../../../../data/data-observatory/boundaries-collection');
var DataObservatoryColumnName = require('../../../../../data/data-observatory/column-name');
var checkAndBuildOpts = require('../../../../../helpers/required-opts');
var $ = require('jquery');

var REQUIRED_OPTS = [
  'regions',
  'form',
  'configModel',
  'nodeDefModel'
];

module.exports = Backbone.Model.extend({
  initialize: function (attrs, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    var fetchOptions = {
      configModel: this._configModel,
      nodeDefModel: this._nodeDefModel
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
    var rows;
    var metadata;

    rows = data.rows;
    if (!rows || rows.length === 0) return;

    metadata = rows[0].obs_getmeta;
    if (!metadata || metadata.length === 0) return;

    var suggestedName = metadata[0].suggested_name;

    this.set('column_name', suggestedName);
    this._setSchema();
    this._form.commit(); // To update the hidden input value
    this._form.trigger('change'); // To force validation
  },

  _getNormalizationType: function (denom) {
    var normalization = 'denormalized';
    var type;
    var aggregation;

    if (denom) {
      type = denom.type;
      aggregation = denom.aggregate;

      if (type === 'Number' && aggregation === 'SUM') {
        normalization = 'area';
      } else {
        normalization = 'denominated';
      }
    }

    return normalization;
  },

  _getColumnNameOptions: function () {
    var normalize = this.get('normalize') || null;
    var normalization = this._getNormalizationType(normalize);

    var defaults = {
      numer_id: null,
      denom_id: null,
      numer_timespan: null
    };

    var columnOptions = _.defaults({
      numer_id: this.get('segment_name'),
      denom_id: normalize,
      numer_timespan: this.get('timespan') || null,
      normalization: normalization
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

    this.getNewColumn([
      this.normalize.fetch(fetchOptions),
      this.timespan.fetch(fetchOptions),
      this.boundaries.fetch(fetchOptions)
    ]);
  },

  _normalizeChanged: function () {
    var fetchOptions = this._getFetchOptions();
    this.getNewColumn([
      this.timespan.fetch(fetchOptions),
      this.boundaries.fetch(fetchOptions)
    ]);
  },

  _timestampChanged: function () {
    var fetchOptions = this._getFetchOptions();
    this.getNewColumn([
      this.boundaries.fetch(fetchOptions)
    ]);
  },

  getNewColumn: function (promises) {
    this.set({column_name: ''});

    var fetchNewColumn = function () {
      var columnOptions = this._getColumnNameOptions();
      DataObservatoryColumnName.fetch(columnOptions);
    }.bind(this);

    $.when.apply($, promises).then(fetchNewColumn);
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
          configModel: this._configModel,
          nodeDefModel: this._nodeDefModel,
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
      },
      column_name: {
        type: 'Hidden',
        editor: {
          value: this.get('column_name')
        }
      }
    };

    this.schema = schema;
    this.trigger('updateSchema', this.schema);
  }

});
