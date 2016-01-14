var _ = require('underscore');

/**
 * Implementation of all common logic of a torque-layer view.
 * All the methods and attributes here need to be consistent across all implementing models.
 *
 * Methods are prefixed with _ to indicate that they are not intended to be used outside the implementing models.
 */
module.exports = {

  _initialAttrs: function (layerModel) {
    var extra = layerModel.get('extra_params');
    return {
      table: layerModel.get('table_name'),
      user: layerModel.get('user_name'),
      column: layerModel.get('property'),
      blendmode: layerModel.get('torque-blend-mode'),
      resolution: 1,
      // TODO: manage time columns
      countby: 'count(cartodb_id)',
      sql_api_domain: layerModel.get('sql_api_domain'),
      sql_api_protocol: layerModel.get('sql_api_protocol'),
      sql_api_port: layerModel.get('sql_api_port'),
      tiler_protocol: layerModel.get('tiler_protocol'),
      tiler_domain: layerModel.get('tiler_domain'),
      tiler_port: layerModel.get('tiler_port'),
      maps_api_template: layerModel.get('maps_api_template'),
      stat_tag: layerModel.get('stat_tag'),
      animationDuration: layerModel.get('torque-duration'),
      steps: layerModel.get('torque-steps'),
      sql: this._getQuery(layerModel),
      visible: layerModel.get('visible'),
      extra_params: {
        api_key: extra ? extra.map_key : ''
      },
      attribution: layerModel.get('attribution'),
      cartocss: layerModel.get('cartocss') || layerModel.get('tile_style'),
      named_map: layerModel.get('named_map'),
      auth_token: layerModel.get('auth_token'),
      no_cdn: layerModel.get('no_cdn'),
      loop: !(layerModel.get('loop') === false)
    };
  },

  _init: function (layerModel) {
    if (layerModel.get('visible')) {
      this.play();
    }

    this.on('tilesLoaded', function () {
      this.trigger('load');
    }, this);

    this.on('tilesLoading', function () {
      this.trigger('loading');
    }, this);

    this.on('change:time', function (changes) {
      this._setModelAttrs({
        step: changes.step,
        time: changes.time,
        renderRange: {
          start: changes.start,
          end: changes.end
        }
      });
    }, this);

    this.on('change:steps', function (changes) {
      this._setModelAttrs({ steps: changes.steps });
    }, this);

    this.on('play', function () {
      this._callModel('play');
    });

    this.on('pause', function () {
      this._callModel('pause');
    });

    layerModel.set({
      isRunning: this.isRunning(),
      time: this.getTime(),
      step: this.getStep(),
      steps: layerModel.get('torque-steps') || (this.provider && this.provider.getSteps()) || this.options.steps || 0
    });

    this._onModel();
  },

  /**
   * Set model property but unon changes first in order to not create an infinite loop
   */
  _setModelAttrs: function (attrs) {
    this._unonModel();
    this.model.set(attrs);
    this._onModel();
  },

  _callModel: function (method) {
    this._unonModel();
    var args = Array.prototype.slice.call(arguments, 1);
    this.model[method].apply(this.model, args);
    this._onModel();
  },

  _onModel: function () {
    this._unonModel();
    this.listenTo(this.model, 'change:isRunning', this._isRunningChanged);
    this.listenTo(this.model, 'change:time', this._timeChanged);
    this.listenTo(this.model, 'change:step', this._stepChanged);
    this.listenTo(this.model, 'change:steps', this._stepsChanged);
    this.listenTo(this.model, 'change:renderRange', this._renderRangeChanged);
  },

  _unonModel: function () {
    this.stopListening(this.model, 'change:isRunning', this._isRunningChanged);
    this.stopListening(this.model, 'change:time', this._timeChanged);
    this.stopListening(this.model, 'change:step', this._stepChanged);
    this.stopListening(this.model, 'change:steps', this._stepsChanged);
    this.stopListening(this.model, 'change:renderRange', this._renderRangeChanged);
  },

  _isRunningChanged: function (m, isRunning) {
    if (isRunning) {
      this.play();
    } else {
      this.pause();
    }
  },

  _timeChanged: function (m, time) {
    this.setStep(this.timeToStep(time));
  },

  _stepChanged: function (m, step) {
    this.setStep(step);
  },

  _stepsChanged: function (m, steps) {
    this.setSteps(steps);
  },

  _renderRangeChanged: function (m, r) {
    if (_.isObject(r) && _.isNumber(r.start) && _.isNumber(r.end)) {
      this.renderRange(r.start, r.end);
    } else {
      this.resetRenderRange();
    }
  },

  _getQuery: function (layerModel) {
    var query = layerModel.get('query');
    var qw = layerModel.get('query_wrapper');
    if (qw) {
      query = _.template(qw)({ sql: query || ('select * from ' + layerModel.get('table_name')) });
    }
    return query;
  }
};
