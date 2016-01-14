var torque = require('torque.js'); // required to setup the "L" object
var _ = require('underscore');
var util = require('cdb.core.util');
var LeafletLayerView = require('./leaflet-layer-view');

/**
 * leaflet torque layer
 * Assumes torque.js to have been loaded
 */
var LeafletTorqueLayer = L.TorqueLayer.extend({
  initialize: function (layerModel, leafletMap) {
    var extra = layerModel.get('extra_params');

    var query = this._getQuery(layerModel);

    // initialize the base layers
    L.TorqueLayer.prototype.initialize.call(this, {
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
      sql: query,
      visible: layerModel.get('visible'),
      extra_params: {
        api_key: extra ? extra.map_key : ''
      },
      attribution: layerModel.get('attribution'),
      cartocss: layerModel.get('cartocss') || layerModel.get('tile_style'),
      named_map: layerModel.get('named_map'),
      auth_token: layerModel.get('auth_token'),
      no_cdn: layerModel.get('no_cdn'),
      dynamic_cdn: layerModel.get('dynamic_cdn'),
      loop: layerModel.get('loop') === false ? false : true,
      instanciateCallback: function () {
        var cartocss = layerModel.get('cartocss') || layerModel.get('tile_style');

        return '_cdbct_' + util.uniqueCallbackName(cartocss + query);
      }
    });

    LeafletLayerView.call(this, layerModel, this, leafletMap);

    // match leaflet events with backbone events
    this.fire = this.trigger;

    // this.setCartoCSS(layerModel.get('tile_style'));
    if (layerModel.get('visible')) {
      this.play();
    }

    this.bind('tilesLoaded', function () {
      this.trigger('load');
    }, this);

    this.bind('tilesLoading', function () {
      this.trigger('loading');
    }, this);

    this.bind('change:time', function (changes) {
      this._setModelAttrs({
        step: changes.step,
        time: changes.time,
        renderRange: {
          start: changes.start,
          end: changes.end
        }
      });
    }, this);

    this.bind('change:steps', function (changes) {
      this._setModelAttrs({ steps: changes.steps });
    }, this);

    this.bind('play', function () {
      this._callModel('play');
    });

    this.bind('pause', function () {
      this._callModel('pause');
    });

    this.model.set({
      isRunning: this.isRunning(),
      time: this.getTime(),
      step: this.getStep(),
      steps: this.provider.getSteps() || this.options.steps || 0
    });

    this._bindModel();
  },

  /**
   * Set model property but unbind changes first in order to not create an infinite loop
   */
  _setModelAttrs: function (attrs) {
    this._unbindModel();
    this.model.set(attrs);
    this._bindModel();
  },

  _callModel: function (method) {
    this._unbindModel();
    var args = Array.prototype.slice.call(arguments, 1);
    this.model[method].apply(this.model, args);
    this._bindModel();
  },

  _bindModel: function () {
    this._unbindModel();
    this.listenTo(this.model, 'change:isRunning', this._isRunningChanged);
    this.listenTo(this.model, 'change:time', this._timeChanged);
    this.listenTo(this.model, 'change:step', this._stepChanged);
    this.listenTo(this.model, 'change:steps', this._stepsChanged);
    this.listenTo(this.model, 'change:renderRange', this._renderRangeChanged);
  },

  _unbindModel: function () {
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
  },

  _modelUpdated: function (model) {
    var changed = this.model.changedAttributes();
    if (changed === false) return;
    /*
    changed.tile_style && this.setCartoCSS(this.model.get('tile_style'));
    if ('query' in changed || 'query_wrapper' in changed) {
      this.setSQL(this._getQuery(this.model));
    }
    */

    if ('visible' in changed)
      this.model.get('visible') ? this.show() : this.hide();

    if ('urls' in changed) {
      // REAL HACK
      this.provider.templateUrl = this.model.get('urls').tiles[0];
      this.provider._setReady(true);
      this._reloadTiles();
    }
  }
});

_.extend(LeafletTorqueLayer.prototype, LeafletLayerView.prototype);

module.exports = LeafletTorqueLayer;
