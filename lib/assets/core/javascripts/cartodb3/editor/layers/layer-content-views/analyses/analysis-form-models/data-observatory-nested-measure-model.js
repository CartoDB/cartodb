var Backbone = require('backbone');
var _ = require('underscore');
var DataObservatoryNormalize = require('../../../../../data/data-observatory/normalize-collection');
var DataObservatoryTimespan = require('../../../../../data/data-observatory/timespan-collection');
var DataObservatoryBoundaries = require('../../../../../data/data-observatory/boundaries-collection');
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

    this.timespan = new DataObservatoryTimespan(null, {
      configModel: this._configModel,
      layerDefinitionModel: this._layerDefinitionModel
    });

    this.boundaries = new DataObservatoryBoundaries(null, {
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
    this.on('change:segment_name', this._measurementChanged, this);
    this.on('change:normalize', this._normalizeChanged, this);
    this.on('change:timespan', this._timestampChanged, this);
  },

  _areaChanged: function () {
    var measurement = this.get('segment_name');

    // If measurement is set, we fetch all collections
    if (measurement) {
      this._measurementChanged(); // this call normalize to fetch internally
    }
  },

  _wrap: function (value) {
    var result = "'" + value + "'";
    return value ? result : null;
  },

  _measurementChanged: function (mdl, measure) {
    var options = _.extend(
      {
        success: this._setSchema,
        error: this._setSchema
      },
      this._getUserSelection()
    );

    this.normalize.fetch(options);
    this.timespan.fetch(options);
    this.boundaries.fetch(options);
  },

  _normalizeChanged: function () {
    var options = _.extend(
      {
        success: this._setSchema,
        error: this._setSchema
      },
      this._getUserSelection()
    );

    this.timespan.fetch(options);
    this.boundaries.fetch(options);
  },

  _timestampChanged: function () {
    var options = _.extend(
      {
        success: this._setSchema,
        error: this._setSchema
      },
      this._getUserSelection()
    );

    this.boundaries.fetch(options);
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
