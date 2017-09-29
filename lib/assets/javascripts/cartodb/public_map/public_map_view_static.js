var cdb = require('cartodb.js-v3');
var MapOptionsHelper = require('../helpers/map_options');

module.exports = cdb.core.View.extend({
  id: 'map',

  className: 'PublicMap-map js-map',

  initialize: function () {
    this._initModels();
    this._createVis();
  },

  _initModels: function () {
    this.vizdata = this.options.vizdata;
    this.mapId = this.options.mapId;
  },

  _manageError: function (error, layer) {
    console.error(error);
    // TODO
  },

  _sendStats: function () {
    // TODO
  },

  _createVis: function () {
    var loadingTime = cdb.core.Profiler.metric('cartodb-js.embed.time_full_loaded').start();
    var visReadyTime = cdb.core.Profiler.metric('cartodb-js.embed.time_vis_loaded').start();
    var vizUrl = '/api/v2/viz/' + this.vizdata.id + '/viz.json';
    var self = this;

    // FIXME var mapOptions = MapOptionsHelper.getMapOptions();
    var mapOptions = {
      search: false,
      title: false,
      description: false,
      shareable: false,
      fullscreen: false,
      cartodb_logo: false,
      scrollwheel: false,
      sublayer_options: {},
      layer_selector: false,
      legends: false,
      auth_token: null,
      https: false,
      no_cdn: true,
      mobile_layout: false
    };

    cdb.createVis('map', vizUrl, mapOptions, function (vis) {
      var fullscreen = vis.getOverlay('fullscreen');

      visReadyTime.end();
      vis.on('load', loadingTime.end);

      if (fullscreen) {
        fullscreen.options.doc = '.cartodb-public-wrapper';
        fullscreen.model.set('allowWheelOnFullscreen', true);
      }

      self.vis = vis;
      self._sendStats();
      self.trigger('map_loaded', vis, this);
      self.$('.js-spinner').remove();
    }).on('error', this._manageError);
  }
});
