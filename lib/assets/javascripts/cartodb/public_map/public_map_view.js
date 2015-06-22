var $ = require('jquery');
var cdb = require('cartodb.js');

/** 
 *  Public vis (map itself)
 *
 */

module.exports = cdb.core.View.extend({

  initialize: function() {
    this.labelsOnTop = false;
    this._createVis();
  },

  _manageError: function(err, layer) {
    if(layer && layer.get('type') === 'torque') {
      this.trigger('map_error', this);
      // hide all the overlays
      var overlays = vis.getOverlays()
      for (var i = 0; i < overlays.length; ++i) {
        var o = overlays[i];
        o.hide && o.hide();
      }
    }
  },

  _sendStats: function() {
    var browser;
    var ua = navigator.userAgent;
    var checks = [
      ['MSIE 11.0', 'ms11'],
      ['MSIE 10.0', 'ms10'],
      ['MSIE 9.0', 'ms9'],
      ['MSIE 8.0', 'ms8'],
      ['MSIE 7.0','ms7'],
      ['Chrome', 'chr'],
      ['Firefox', 'ff'],
      ['Safari', 'ff']
    ]
    for(var i = 0; i < checks.length && !browser; ++i) {
      if(ua.indexOf(checks[i][0]) !== -1) browser = checks[i][1];
    }
    browser = browser || 'none';
    cartodb.core.Profiler.metric('cartodb-js.embed.' + browser).inc();
  },

  /**
   * enabled labels on top for cartodb basemaps
   */
  enableLabelsOnTop: function() {
    this.labelsOnTop = true;
    if (this.vis) {
      this.setLabelsOnTop(this.vis, this.layers);
    }
  },

  /**
   * reads the visualization layer list and if it's using a cartodb baselayer with
   * labels it replaces it by the version without labels and add the labels layer to the
   * top
   * this is a test and should be removed
   */
  setLabelsOnTop: function(vis, layers) {
    var basemaps = {
      "https://cartocdn_{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png": "",
      "https://cartocdn_{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png": "",
      "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png": "",
      "https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png": "",
      "http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png":"",
      "http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png":""
    }

    function isCartoDBBasemap(url) {
      return url in basemaps;
    }

    function basemapUrlWithoutLabels(url) {
      return url.replace('_all', '_nolabels');
    }
    function basemapUrlWithOnlyLabels(url) {
      return url.replace('_all', '_only_labels');
    }

    var m = layers[0].model;

    if ((m.get('type') === "Tiled" || m.get('type') === "tiled") && isCartoDBBasemap(m.get('urlTemplate'))) {
      var template = m.get('urlTemplate');
      m.set('urlTemplate', basemapUrlWithoutLabels(m.get('urlTemplate')));
      // add the labels only on top
      vis.map.layers.add({
        urlTemplate: basemapUrlWithOnlyLabels(template),
        minZoom: "0",
        maxZoom: "18",
        subdomains: "abcd",
        type: "tiled"
      });
    }
  },

  _createVis: function() {
    var loadingTime  = cartodb.core.Profiler.metric('cartodb-js.embed.time_full_loaded').start();
    var visReadyTime = cartodb.core.Profiler.metric('cartodb-js.embed.time_vis_loaded').start();
    var self = this;

    cartodb.createVis('map', this.options.vizdata, this.options.map_options, function(vis, layers) {
      self.vis = vis;
      self.layers = layers;

      if (self.labelsOnTop) {
        self.setLabelsOnTop(vis, layers);
      }

      visReadyTime.end();

      vis.on('load', function() { loadingTime.end() });

      // Check fullscreen button
      var fullscreen = vis.getOverlay("fullscreen");
      
      if (fullscreen) {
        fullscreen.options.doc = ".cartodb-public-wrapper";
        fullscreen.model.set("allowWheelOnFullscreen", self.options.map_options.scrollwheelEnabled);
      }

      //some stats
      self._sendStats();

      // Map loaded!
      self.trigger('map_loaded', vis, this);

    }).on('error', this._manageError);
  },

  // "Public" method

  invalidateMap: function() {
    this.vis && this.vis.mapView.invalidateSize()
  }

});
