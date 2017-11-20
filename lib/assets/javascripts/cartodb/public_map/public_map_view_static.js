var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var MapOptionsHelper = require('../helpers/map_options');
var Browsers = require('../helpers/browsers');

var PUBLIC_MAP_DEFAULT_OPTIONS = {
  https: true,
  no_cdn: true,
  description: false,
  title: false,
  cartodb_logo: false,
  scrollwheel: false,
  mobile_layout: false
};

module.exports = cdb.core.View.extend({
  initialize: function () {
    this.template = cdb.templates.getTemplate('public_map/views/public_map');
    this._initModels();
  },

  render: function () {
    this.$el.html(this.template({
      mapId: this.mapId
    }));

    return this;
  },

  _initModels: function () {
    this.mapOwnerUser = this.options.mapOwnerUser;
    this.data = this.options.data;
    this.mapId = this.options.mapId;
    this.vizdata = this.options.vizdata;
    this.password = this.options.password;
    this.vis = null;
    this.isInsideOrg = this.options.isInsideOrg;
  },

  _sendStats: function () {
    var browserId = _.find(Browsers, function (browser) {
      return _isBrowser(browser.name);
    }).id || 'none';

    cdb.core.Profiler.metric('cartodb-js.embed.' + browserId).inc();
  },

  _createVis: function () {
    var apiURLTemplate = _.template('<%= baseURL %>/api/v2/viz/<%= uuid %>/viz.json');

    var loadingTime = cdb.core.Profiler.metric('cartodb-js.embed.time_full_loaded').start();
    var visReadyTime = cdb.core.Profiler.metric('cartodb-js.embed.time_vis_loaded').start();

    var vizUrl = apiURLTemplate({
      baseURL: this.mapOwnerUser.get('base_url'),
      uuid: this.vizdata.id,
      owner: this.data.config.user_name
    });

    var mapOptions = _.extend({},
      MapOptionsHelper.getMapOptions(),
      PUBLIC_MAP_DEFAULT_OPTIONS);

    if (this.password) {
      vizUrl = vizUrl + '?password=' + this.password;
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

  _manageError: function (error, layer) {
    if (layer && layer.get('type') === 'torque') {
      this.trigger('map_error', error);
      this.vis.getOverlays().forEach(function (overlay) {
        overlay.hide && overlay.hide();
      });
    }
  },

  _invalidateMap: function () {
    this.vis && this.vis.mapView.invalidateSize();
  }
});

var _isBrowser = function (browserName) {
  return navigator.userAgent.indexOf(browserName) !== -1;
};
