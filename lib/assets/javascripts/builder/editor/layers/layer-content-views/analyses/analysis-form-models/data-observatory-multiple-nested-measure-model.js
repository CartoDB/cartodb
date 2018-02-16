var $ = require('jquery');
var Backbone = require('backbone');
var _ = require('underscore');
var DataObservatoryNormalize = require('builder/data/data-observatory/normalize-collection');
var DataObservatoryTimespan = require('builder/data/data-observatory/timespan-collection');
var DataObservatoryBoundaries = require('builder/data/data-observatory/boundaries-collection');
var MeasurementModel = require('builder/data/data-observatory/measurement-model');
var DataObservatoryColumnName = require('builder/data/data-observatory/column-name');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'regions',
  'form',
  'configModel',
  'nodeDefModel'
];

var DENOMINATORS_BLACKLIST = ['', 'area'];

var wrap = function (value) {
  var result = "'" + value + "'";
  return result;
};

var braces = function (value) {
  return "'{" + value + "}'";
};

module.exports = Backbone.Model.extend({
  defaults: {
    segment_name: null,
    normalization: 'prenormalized',
    normalize: '',
    timespan: null,
    boundaries: null,
    column_name: ''
  },

  initialize: function (attrs, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    var fetchOptions = {
      configModel: this._configModel,
      nodeDefModel: this._nodeDefModel
    };

    this.measurement = new MeasurementModel({}, fetchOptions);

    this.normalize = new DataObservatoryNormalize(null, fetchOptions);
    this.timespan = new DataObservatoryTimespan(null, fetchOptions);
    this.boundaries = new DataObservatoryBoundaries(null, fetchOptions);
    this.columnName = new DataObservatoryColumnName(fetchOptions);

    this._fetchMeasurement = this._fetchMeasurement.bind(this);
    this._syncMeasurement = this._syncMeasurement.bind(this);
    this._fetchNormalize = this._fetchNormalize.bind(this);
    this._syncNormalize = this._syncNormalize.bind(this);
    this._fetchTimespan = this._fetchTimespan.bind(this);
    this._syncTimespan = this._syncTimespan.bind(this);
    this._fetchBoundaries = this._fetchBoundaries.bind(this);
    this._syncBoundaries = this._syncBoundaries.bind(this);
    this._fetchNewColumn = this._fetchNewColumn.bind(this);
    this._columnNameSuccess = this._columnNameSuccess.bind(this);
    this._setSchema = this._setSchema.bind(this);

    if (this.get('normalization') === 'area' && !this.get('normalize')) {
      this.set({ normalize: 'area' });
    }

    this._initBinds();
    this._setSchema();

    // If measurement exists, it means the region changed
    if (this.get('segment_name') != null) {
      this._regionChanged();
    }

    this._initialBoundaryValue = this.get('boundaries');
  },

  _initBinds: function () {
    this.listenTo(this.measurement, 'change:state', this._setSchema);
    this.listenTo(this.normalize.stateModel, 'change:state', this._setSchema);
    this.listenTo(this.timespan.stateModel, 'change:state', this._setSchema);
    this.listenTo(this.boundaries.stateModel, 'change:state', this._setSchema);

    this.on('change:segment_name', this._measurementChanged, this);
    this.on('change:normalize', this._normalizeChanged, this);
    this.on('change:timespan', this._timestampChanged, this);
  },

  _cleanColumnName: function () {
    // Avoiding more killing events!
    this.attributes.column_name = '';
  },

  _regionChanged: function () {
    this._cleanColumnName();

    this._fetchMeasurement()
      .then(this._syncMeasurement)
      .then(this._fetchNormalize)
      .then(this._syncNormalize)
      .then(this._fetchTimespan)
      .then(this._syncTimespan)
      .then(this._fetchBoundaries)
      .then(this._syncBoundaries)
      .then(this._fetchNewColumn);
  },

  _measurementChanged: function () {
    this._cleanColumnName();

    this._fetchNormalize()
      .then(this._syncNormalize)
      .then(this._fetchTimespan)
      .then(this._syncTimespan)
      .then(this._fetchBoundaries)
      .then(this._syncBoundaries)
      .then(this._fetchNewColumn);
  },

  _normalizeChanged: function () {
    this._cleanColumnName();

    this._setNormalization();
    this._fetchTimespan()
      .then(this._syncTimespan)
      .then(this._fetchBoundaries)
      .then(this._syncBoundaries)
      .then(this._fetchNewColumn);
  },

  _timestampChanged: function () {
    this._cleanColumnName();

    this._fetchBoundaries()
      .then(this._syncBoundaries)
      .then(this._fetchNewColumn);
  },

  _fetchMeasurement: function () {
    var area = this._form.model.get('area');
    var fetchOptions = {
      area: area && braces(area),
      measurement: braces(this.get('segment_name'))
    };
    return this.measurement.fetch(fetchOptions);
  },

  _fetchNormalize: function () {
    var fetchOptions = this._getUserSelection();
    return this.normalize.fetch(fetchOptions);
  },

  _syncMeasurement: function () {
    var deferred = $.Deferred();
    var defaults = this.defaults;

    // if measurement has no value, break the chain and restore the measurement
    if (!this.measurement.getValue()) {
      deferred.reject();
      // we don't want to trigger more listeners that do more fetch
      this.set(defaults, {silent: true});
      this._setSchema();
      this._form.trigger('change');
    } else {
      deferred.resolve();
    }
    return deferred.promise();
  },

  _syncNormalize: function () {
    var deferred = $.Deferred();
    var measurement = this.measurement;
    var normalize = this.get('normalize');
    var selected = this.normalize.setSelected(normalize);
    var areaAllowed = (measurement && measurement.get('type') === 'Numeric' && measurement.get('aggregate') === 'sum');

    if (!selected && normalize !== 'area' || !selected && normalize === 'area' && !areaAllowed) {
      this.set({ normalize: '' }, { silent: true });
      this._setSchema();
    }

    this._setNormalization();
    deferred.resolve();
    return deferred.promise();
  },

  _fetchTimespan: function () {
    var fetchOptions = this._getUserSelection();
    return this.timespan.fetch(fetchOptions);
  },

  _syncTimespan: function () {
    var deferred = $.Deferred();
    var timespan = this.get('timespan');
    var selected = this.timespan.setSelected(timespan);

    if (!selected) {
      // We don't need setSchema here, because the time span is a controlled component
      // this means we pass the collection as attribute and the editor render itself when changes
      this.timespan.selectFirstAsDefault();
      selected = this.timespan.getSelectedItem();
      if (selected) {
        timespan = selected.getValue();
        this.set({ timespan: timespan }, { silent: true });
      }
    }

    deferred.resolve();
    return deferred.promise();
  },

  _fetchBoundaries: function () {
    var fetchOptions = this._getUserSelection();
    return this.boundaries.fetch(fetchOptions);
  },

  _syncBoundaries: function () {
    var deferred = $.Deferred();
    var hasInitialBoundaryValue = this._initialBoundaryValue != null;
    var selected = hasInitialBoundaryValue && this.boundaries.setSelected(this._initialBoundaryValue);

    if (!selected) {
      this.set({ boundaries: null }, { silent: true });
      this._setSchema();
    }

    this._initialBoundaryValue = null;
    deferred.resolve();
    return deferred.promise();
  },

  _fetchNewColumn: function () {
    var columnOptions = this._getColumnNameOptions();
    this.columnName.fetch(columnOptions);
  },

  _columnNameSuccess: function (data) {
    var rows;
    var metadata;

    rows = data.rows;
    if (!rows || rows.length === 0) return;

    metadata = rows[0].obs_getmeta;
    if (!metadata || metadata.length === 0) return;

    var suggestedName = metadata[0].suggested_name;

    this.set({ column_name: suggestedName });
    this._setSchema();
    this._form.trigger('change');
  },

  _setNormalization: function () {
    var denom = this.get('normalize');
    denom = denom === '' ? null : denom;
    var normalization = 'prenormalized';

    if (denom) {
      normalization = (denom === 'area') ? 'area' : 'denominated';
    }

    this.set('normalization', normalization);
  },

  _getColumnNameOptions: function () {
    var normalize = this.get('normalize') || null;
    if (normalize !== null) {
      normalize = (DENOMINATORS_BLACKLIST.indexOf(normalize) >= 0) ? null : normalize;
    }
    var normalization = this.get('normalization');

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

  _getNormalizeOptions: function () {
    var measurement = this.measurement;
    var options = this.normalize.models;

    if (measurement && measurement.get('type') === 'Numeric' && measurement.get('aggregate') === 'sum') {
      options = options.concat([{
        label: _t('analyses.data-observatory-measure.area'),
        val: 'area'
      }]);
    }

    return options;
  },

  _getUserSelection: function () {
    var normalize = this.get('normalize');
    // We are inserting area option manually, so we need to filter that value for the backend
    normalize = (DENOMINATORS_BLACKLIST.indexOf(normalize) >= 0) ? null : wrap(normalize);

    var timespan = this.get('timespan');
    timespan = timespan != null ? wrap(timespan) : null;

    var region = wrap(this._form.model.get('area'));
    var measurement = wrap(this.get('segment_name'));

    return {
      region: region,
      measurement: measurement,
      denom_id: normalize,
      timespan: timespan
    };
  },

  _getInitialBoundaryValue: function () {
    return this.get('boundaries') || this.boundaries.getPreSelectedBoundaryValue();
  },

  _setSchema: function () {
    var normalizeOptions = this._getNormalizeOptions();
    var noMeasurement = this.get('segment_name') == null;
    var isDisabled = noMeasurement || normalizeOptions.length === 0;
    var schema = {
      segment_name: {
        type: 'DataObservatoryDropdown',
        title: _t('editor.layers.analysis-form.data-observatory.measurements.label'),
        editorAttrs: {
          configModel: this._configModel,
          nodeDefModel: this._nodeDefModel,
          model: this._form.model,
          placeholder: _t('editor.layers.analysis-form.data-observatory.measurements.placeholder'),
          measurementModel: this.measurement,
          loading: this.measurement.get('state') === 'fetching'
        },
        dialogMode: 'float',
        region: this._form.model.get('area'),
        validators: ['required']
      },
      normalize: {
        type: 'EnablerEditor',
        title: '',
        label: _t('editor.layers.analysis-form.data-observatory.normalize.label'),
        isDisabled: isDisabled,
        editor: {
          type: 'Select',
          options: normalizeOptions,
          dialogMode: 'float',
          editorAttrs: {
            disabled: isDisabled,
            placeholder: _t('editor.layers.analysis-form.data-observatory.normalize.placeholder'),
            disabledPlaceholder: _t('editor.layers.analysis-form.data-observatory.normalize.disabled-placeholder'),
            showSearch: false,
            showLabel: false,
            loading: this.normalize.stateModel.get('state') === 'fetching'
          }
        }
      },
      timespan: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.data-observatory.timespan.label'),
        dialogMode: 'float',
        isDisabled: noMeasurement,
        collection: this.timespan,
        editorAttrs: {
          placeholder: _t('editor.layers.analysis-form.data-observatory.timespan.placeholder')
        }
      },
      boundaries: {
        type: 'Slider',
        title: _t('editor.layers.analysis-form.data-observatory.boundaries.label'),
        values: this.boundaries.getValues(),
        labels: this.boundaries.getLabels(),
        value: this._getInitialBoundaryValue(),
        initial: 'highest'
      },
      column_name: {
        type: 'Hidden'
      },
      normalization: {
        type: 'Hidden'
      }
    };

    this.schema = schema;
    this.trigger('updateSchema', this.schema);
  }
});
