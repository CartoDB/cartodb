var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');

/** 
 *  Public vis (map itself)
 *
 */

module.exports = cdb.core.View.extend({

  initialize: function() {
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

  _createVis: function() {
    var loadingTime  = cartodb.core.Profiler.metric('cartodb-js.embed.time_full_loaded').start();
    var visReadyTime = cartodb.core.Profiler.metric('cartodb-js.embed.time_vis_loaded').start();
    var self = this;

    cartodb.createVis('map', this.options.vizdata, this.options.map_options, function(vis) {
      self.vis = vis;

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

      self.$('.js-spinner').remove();

    }).on('error', this._manageError);
  },

  // "Public" method

  invalidateMap: function() {
    this.vis && this.vis.mapView.invalidateSize()
  }

});