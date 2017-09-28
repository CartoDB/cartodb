var cdb = require('cartodb.js-v3');
var $ = require('jquery');
var PublicMapContainerView = require('./public_map_container_view');
var PublicHeaderView = require('../public/public_header_view');
var PublicNavigationView = require('../public/public_navigation_view');

module.exports = cdb.core.View.extend({
  initialize: function () {
    this._initModels();
    this._initViews();
    this._createVis();
  },

  invalidateMap: function () {
    this.vizdata && this.vizdata.mapView.invalidateSize();
  },

  _initModels: function () {
    this.currentUser = this.options.currentUser;
    this.vizdata = this.options.vizdata;
    this.isHosted = this.options.isHosted;
    this.mapId = this.options.mapId;
  },

  _initViews: function () {
    this.publicHeaderView = new PublicHeaderView({
      currentUser: this.currentUser,
      isHosted: this.isHosted
    });

    this.publicMapContainerView = new PublicMapContainerView({
      mapId: this.mapId
    });

    this.publicNavigationView = new PublicNavigationView();

    this.$('#app').append(this.publicHeaderView.render().el);
    this.$('#app').append(this.publicMapContainerView.render().el);
    this.$('#app').append(this.publicNavigationView.render().el);

    this.$body = $(document.body);
    this.$map = this.$body.find('#' + this.mapId);

    return this;
  },

  _manageError: function (error, layer) {
    // TODO public_map_static
  },

  _sendStats: function () {
    // TODO public_map_static
  },

  _createVis: function () {
    var loadingTime = cartodb.core.Profiler.metric('cartodb-js.embed.time_full_loaded').start();
    var visReadyTime = cartodb.core.Profiler.metric('cartodb-js.embed.time_vis_loaded').start();
    var self = this;

    cartodb.createVis('map', this.vizdata, {}, function (vis) {
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
