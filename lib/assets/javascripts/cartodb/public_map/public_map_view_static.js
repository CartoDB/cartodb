var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var MapOptionsHelper = require('../helpers/map_options');
var Browsers = require('../helpers/browsers');

var API_URL = _.template('/u/<%- owner %>/api/v2/viz/<%- uuid %>/viz.json');

function _isBrowser (browserName) {
  return navigator.userAgent.indexOf(browserName) !== -1;
}

module.exports = cdb.core.View.extend({
  initialize: function () {
    this.template = cdb.templates.getTemplate('public_map/views/public_map');
    this._initModels();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(this.template({
      mapId: this.mapId
    }));

    return this;
  },

  _initModels: function () {
    this.data = this.options.data;
    this.mapId = this.options.mapId;
    this.vizdata = this.options.vizdata;
    this.vis = null;
  },

  _sendStats: function () {
    var browserId = _.find(Browsers, function (browser) {
      return _isBrowser(browser.name);
    }).id || 'none';

    cdb.core.Profiler.metric('cartodb-js.embed.' + browserId).inc();
  },

  createVis: function () {
    var loadingTime = cdb.core.Profiler.metric('cartodb-js.embed.time_full_loaded').start();
    var visReadyTime = cdb.core.Profiler.metric('cartodb-js.embed.time_vis_loaded').start();

    var vizUrl = API_URL({
      uuid: this.vizdata.id,
      owner: this.data.config.user_name
    });

    var mapOptions = _.extend(MapOptionsHelper.getMapOptions(), {
      https: true,
      no_cdn: true,
      description: false,
      title: false,
      cartodb_logo: false,
      scrollwheel: false,
      mobile_layout: false
    });

    if (this.options.password) {
      vizUrl = vizUrl + '?password=' + this.options.password;
      mapOptions = _.extend({}, mapOptions, {
        auth_token: this.vizdata.auth_tokens
      });
    }

    var self = this;
    cdb.createVis(this.mapId, vizUrl, mapOptions, function (vis) {
      var fullscreen = vis.getOverlay('fullscreen');

      visReadyTime.end();
      vis.on('load', function () {
        loadingTime.end();
      });

      if (fullscreen) {
        fullscreen.options.doc = '.cartodb-public-wrapper';
        fullscreen.model.set('allowWheelOnFullscreen', true);
      }

      self.vis = vis;
      self._sendStats();
      self.$('.js-spinner').remove();
    })
      .on('error', this._manageError);
  },

  _manageError (error, layer) {
    if (layer && layer.get('type') === 'torque') {
      this.trigger('map_error', error);
      this.vis.getOverlays().forEach(function (overlay) {
        overlay.hide && overlay.hide();
      });
    }
  },

  invalidateMap: function () {
    this.vis && this.vis.mapView.invalidateSize();
  }
});
