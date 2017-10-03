var cdb = require('cartodb.js-v3');
var _ = require('underscore');
var MapOptionsHelper = require('../helpers/map_options');
var Browsers = require('../helpers/browsers');

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
    this.mapId = this.options.mapId;
    this.vizdata = this.options.vizdata;
  },

  _sendStats: function () {
    // FIXME we should review this function
    var browserId = 'none';

    Browsers.forEach(function (browser) {
      if (_isBrowser.call(this, browser.name)) {
        browserId = browser.id;
        return true;
      }
    });

    cdb.core.Profiler.metric('cartodb-js.embed.' + browserId).inc();
  },

  _manageError: function (error, layer) {
    if (layer && layer.get('type') === 'torque') {
      this.trigger('map_error', error);
      this.vis.getOverlays().forEach(function (overlay) {
        overlay.hide && overlay.hide();
      });
    }
  },

  createVis: function () {
    var loadingTime = cdb.core.Profiler.metric('cartodb-js.embed.time_full_loaded').start();
    var visReadyTime = cdb.core.Profiler.metric('cartodb-js.embed.time_vis_loaded').start();
    var vizUrl = '/api/v2/viz/' + this.vizdata.id + '/viz.json';
    var mapOptions = _.extend(MapOptionsHelper.getMapOptions(), {
      https: true,
      no_cdn: true,
      description: false,
      title: false,
      cartodb_logo: false,
      scrollwheel: false,
      mobile_layout: false
    });

    var self = this;

    cdb.createVis(this.mapId, vizUrl, mapOptions, function (vis) {
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
  },

  invalidateMap: function () {
    this.vis && this.vis.mapView.invalidateSize();
  }
});

function _isBrowser (browserName) {
  return navigator.userAgent.indexOf(browserName) !== -1;
}
