var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var EmbedMapContentView = require('./embed_map_content_view');
var EmbedMapBrowsersView = require('./embed_map_browsers_view');
var VendorScriptsView = require('../common/vendor_scripts_view');
var MapOptionsHelper = require('../helpers/map_options');

module.exports = cdb.core.View.extend({
  initialize: function () {
    this._initModels();
    this._initViews();
    this._initVendorViews();
    this._createVis();
  },

  _initModels: function () {
    this.data = this.options.data;
    this.assetsVersion = this.options.assetsVersion;
    this.vizdata = this.options.vizdata;
    this.password = this.options.password;
    this.mapId = this.options.mapId;
    this.currentUser = this.options.currentUser;
    this.mapOwnerUser = this.options.mapOwnerUser;
    this.vis = null;
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

    var mapOptions = _.extend(MapOptionsHelper.getMapOptions(), {
      https: true,
      no_cdn: true
    });

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

  _initViews: function () {
    var embedMapContentView = new EmbedMapContentView({
      className: 'embed-full-height',
      owner: this.mapOwnerUser,
      currentUser: this.currentUser,
      vizID: this.vizdata.id,
      likes: this.vizdata.likes,
      liked: this.vizdata.liked
    });
    this.addView(embedMapContentView);
    this.$el.append(embedMapContentView.render().el);

    var embedMapBrowsersView = new EmbedMapBrowsersView();
    this.addView(embedMapBrowsersView);
    this.$el.append(embedMapBrowsersView.render().el);
  },

  _initVendorViews: function () {
    var vendorScriptsView = new VendorScriptsView({
      config: this.data.config,
      assetsVersion: this.assetsVersion,
      user: this.currentUser,
      trackjsAppKey: 'embeds',
      googleAnalyticsTrack: 'embeds',
      googleAnalyticsPublicView: true
    });
    document.body.appendChild(vendorScriptsView.render().el);
    this.addView(vendorScriptsView);
  }
});
