var cdb = require('cartodb.js-v3');
var MapOptionsHelper = require('../helpers/map_options');

module.exports = cdb.core.View.extend({
  initialize: function () {
    this.template = cdb.templates.getTemplate('public_map/views/public_map');
    this._initModels();
  },

  invalidateMap: function () {
    this.vizdata && this.vizdata.mapView.invalidateSize();
  },

  render: function () {
    this.$el.html(this.template({
      mapId: this.mapId
    }));

    this._createVis();
    return this;
  },

  _initModels: function () {
    this.data = this.options.data;
    this.vizdata = this.options.vizdata;
    this.mapId = this.options.mapId;
  },

  _manageError: function (error, layer) {
    console.error(error);
  },

  _sendStats: function () {
    // TODO public_map_static
  },

  _createVis: function () {
    var loadingTime = cdb.core.Profiler.metric('cartodb-js.embed.time_full_loaded').start();
    var visReadyTime = cdb.core.Profiler.metric('cartodb-js.embed.time_vis_loaded').start();
    var vizdataJson = '/api/v2/viz/' + this.vizdata.id + '/viz.json';
    var self = this;

    cdb.config.set('url_prefix', this.data.user_data.base_url);
    var mapOptions = MapOptionsHelper.getMapOptions();

    mapOptions.https = true;
    mapOptions.auth_token = this.vizdata.auth_tokens;
    mapOptions.no_cdn = true;
    mapOptions.description = false;
    mapOptions.title = false;
    mapOptions.cartdb_logo = false;
    mapOptions.fullscreen = false;
    mapOptions.scrollwheel = false;
    mapOptions.mobile_layout = true;

    this.map = cdb.createVis('map', vizdataJson, mapOptions, function (vis) {
      var fullscreen = vis.getOverlay('fullscreen');
      self.vis = vis;
      visReadyTime.end();
      vis.on('load', loadingTime.end);

      if (fullscreen) {
        fullscreen.options.doc = '.cartodb-public-wrapper';
        fullscreen.model.set('allowWheelOnFullscreen', true);
      }

      self._sendStats();
      self.trigger('map_loaded', vis, this);
      self.$('.js-spinner').remove();
    }).on('error', this._manageError);
  }
});
