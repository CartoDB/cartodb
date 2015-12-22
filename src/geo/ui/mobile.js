var _ = require('underscore');
var Backbone = require('backbone');
var cdb = require('cdb'); // cdb.geo.ui.*
var $ = require('jquery');
require('jquery.jscrollpane'); // registers itself to $.jScrollPane
var templates = require('cdb.templates');
var sanitize = require('../../core/sanitize.js');
var View = require('../../core/view');
var Template = require('../../core/template');
var Zoom = require('./zoom');
var TilesLoader = require('./tiles-loader');
var Search = require('./search/search');
var MobileLayer = require('./mobile-layer');

var Mobile = View.extend({
  className: 'cartodb-mobile',

  events: {
    'click .toggle': '_toggle',
    'click .fullscreen': '_toggleFullScreen',
    'click .backdrop': '_onBackdropClick',
    'dblclick .aside': '_stopPropagation',
    'dragstart .aside': '_checkOrigin',
    'mousedown .aside': '_checkOrigin',
    'touchstart .aside': '_checkOrigin',
    'MSPointerDown .aside': '_checkOrigin',
  },

  initialize: function () {
    _.bindAll(this, '_toggle', '_reInitScrollpane');

    _.defaults(this.options, this.default_options);

    this.hasLayerSelector = false;
    this.layersLoading = 0;

    this.visualization = this.options.visualization;

    this.mobileEnabled = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    this.visibility_options = this.options.visibility_options || {};

    this.mapView = this.options.mapView;
    this.map = this.mapView.map;

    this.template = this.options.template ? this.options.template : templates.getTemplate('geo/zoom');

    this.overlays = this.options.overlays;

    this._setupModel();

    window.addEventListener('orientationchange', _.bind(this.doOnOrientationChange, this));

    this._addWheelEvent();
  },

  loadingTiles: function () {
    if (this.loader) {
      this.loader.show();
    }

    if (this.layersLoading === 0) {
      this.trigger('loading');
    }
    this.layersLoading++;
  },

  loadTiles: function () {
    if (this.loader) {
      this.loader.hide();
    }
    this.layersLoading--;
    // check less than 0 because loading event sometimes is
    // thrown before visualization creation
    if (this.layersLoading <= 0) {
      this.layersLoading = 0;
      this.trigger('load');
    }
  },

  _addWheelEvent: function () {
    var self = this;
    var mapView = this.options.mapView;

    $(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange', function () {
      if ( !document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
        mapView.options.map.set('scrollwheel', false);
      }

      mapView.invalidateSize();

    });
  },

  _setupModel: function () {
    this.model = new Backbone.Model({
      open: false,
      layer_count: 0
    });

    this.model.on('change:open', this._onChangeOpen, this);
    this.model.on('change:layer_count', this._onChangeLayerCount, this);
  },

  /**
   *  Check event origin
   */
  _checkOrigin: function (ev) {
    // If the mouse down come from jspVerticalBar
    // dont stop the propagation, but if the event
    // is a touchstart, stop the propagation
    var come_from_scroll = (($(ev.target).closest('.jspVerticalBar').length > 0) && (ev.type != 'touchstart'));

    if (!come_from_scroll) {
      ev.stopPropagation();
    }
  },

  _stopPropagation: function (ev) {
    ev.stopPropagation();
  },

  _onBackdropClick: function (e) {
    e.preventDefault();
    e.stopPropagation();

    this.$('.backdrop').fadeOut(250);
  },

  _toggle: function (e) {
    e.preventDefault();
    e.stopPropagation();

    this.model.set('open', !this.model.get('open'));
  },

  _toggleFullScreen: function (ev) {
    ev.stopPropagation();
    ev.preventDefault();

    var doc = window.document;
    var docEl = $('#map > div')[0];

    var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen;
    var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen;

    var mapView = this.options.mapView;

    if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement) {
      requestFullScreen.call(docEl);
      if (mapView) {
        mapView.options.map.set('scrollwheel', true);
      }
    } else {
      cancelFullScreen.call(doc);
    }
  },

  _open: function () {
    var right = this.$el.find('.aside').width();

    this.$el.find('.cartodb-header').animate({ right: right }, 200);
    this.$el.find('.aside').animate({ right: 0 }, 200);
    this._initScrollPane();
  },

  _close: function () {
    this.$el.find('.cartodb-header').animate({ right: 0 }, 200);
    this.$el.find('.aside').animate({ right: - this.$el.find('.aside').width() }, 200);
  },

  default_options: {
    timeout: 0,
    msg: ''
  },

  _stopPropagation: function (ev) {
    ev.stopPropagation();
  },

  doOnOrientationChange: function () {
    switch (window.orientation) {
      case -90:
      case 90: this.recalc('landscape');
        break;
      default: this.recalc('portrait');
        break;
    }
  },

  recalc: function (orientation) {
    var height = $('.legends > div.cartodb-legend-stack').height();

    if (this.$el.hasClass('open') && height < 100 && !this.$el.hasClass('torque')) {
      this.$el.css('height', height);
      this.$el.find('.top-shadow').hide();
      this.$el.find('.bottom-shadow').hide();
    } else if (this.$el.hasClass('open') && height < 100 && this.$el.hasClass('legends') && this.$el.hasClass('torque')) {
      this.$el.css('height', height + $('.legends > div.torque').height());
      this.$el.find('.top-shadow').hide();
      this.$el.find('.bottom-shadow').hide();
    }
  },

  _onChangeLayerCount: function () {
    var layer_count = this.model.get('layer_count');
    var msg = layer_count + ' layer' + (layer_count != 1 ? 's' : '');
    this.$el.find('.aside .layer-container > h3').html(msg);
  },

  _onChangeOpen: function () {
    this.model.get('open') ? this._open() : this._close();
  },

  _createLayer: function (_class, opts) {
    return new cdb.geo.ui[_class](opts);
  },

  _getLayers: function () {
    this.layers = [];

    _.each(this.map.layers.models, this._getLayer, this);
  },

  _getLayer: function (layer) {
    if (layer.get('type') === 'layergroup' || layer.get('type') === 'namedmap') {
      layer.layers.each(function (layer, i) {
        // TODO: We could probably use layer.getName directly in the layer selector
        // instead of having to set this up here for layers inside `layer_group` layers.
        // We'd need to take `torque` layers into account to.
        layer.set('layer_name', layer.getName());
        this.layers.push(layer);
      }, this);
    } else if (layer.get('type') === 'CartoDB' || layer.get('type') === 'torque') {
      this.layers.push(layer);
    }
  },

  _reInitScrollpane: function () {
    this.$('.scrollpane').data('jsp') && this.$('.scrollpane').data('jsp').reinitialise();
  },

  _bindOrientationChange: function () {
    var self = this;

    var onOrientationChange = function () {
      $('.cartodb-mobile .scrollpane').css('max-height', self.$el.height() - 30);
      $('.cartodb-mobile .scrollpane').data('jsp') && $('.cartodb-mobile .scrollpane').data('jsp').reinitialise();
    };

    if (!window.addEventListener) {
      window.attachEvent('orientationchange', onOrientationChange, this);
    } else {
      window.addEventListener('orientationchange', _.bind(onOrientationChange));
    }
  },

  _renderOverlays: function () {
    var hasSearchOverlay = false;
    var hasZoomOverlay = false;
    var hasLoaderOverlay = false;
    var hasLayerSelector = false;

    _.each(this.overlays, function (overlay) {
      if (!this.visibility_options.search && overlay.type == 'search') {
        if (this.visibility_options.search !== false && this.visibility_options.search !== 'false') {
          this._addSearch();
          hasSearchOverlay = true;
        }
      }

      if (!this.visibility_options.zoomControl && overlay.type === 'zoom') {
        if (this.visibility_options.zoomControl !== 'false') {
          this._addZoom();
          hasZoomOverlay = true;
        }
      }

      if (!this.visibility_options.loaderControl && overlay.type === 'loader') {
        if (this.visibility_options.loaderControl !== 'false') {
          this._addLoader();
          hasLoaderOverlay = true;
        }
      }

      if (overlay.type == 'fullscreen' && !this.mobileEnabled) {
        this._addFullscreen();
      }

      if (overlay.type == 'header') {
        this._addHeader(overlay);
      }

      if (overlay.type == 'layer_selector') {
        hasLayerSelector = true;
      }

    }, this);

    var search_visibility = this.visibility_options.search === true || this.visibility_options.search === 'true';
    var zoom_visibility = this.visibility_options.zoomControl === true || this.visibility_options.zoomControl === 'true';
    var loader_visibility = this.visibility_options.loaderControl === true || this.visibility_options.loaderControl === 'true';
    var layer_selector_visibility = this.visibility_options.layer_selector;

    if (!hasSearchOverlay && search_visibility) this._addSearch();
    if (!hasZoomOverlay && zoom_visibility)   this._addZoom();
    if (!hasLoaderOverlay && loader_visibility) this._addLoader();
    if (layer_selector_visibility || hasLayerSelector && layer_selector_visibility == undefined) this.hasLayerSelector = true;
  },

  _initScrollPane: function () {
    if (this.$scrollpane) return;

    var self = this;

    var height = this.$el.height();
    this.$scrollpane = this.$el.find('.scrollpane');

    setTimeout(function () {
      self.$scrollpane.css('max-height', height - 60);
      self.$scrollpane.jScrollPane({ showArrows: true });
    }, 500);
  },

  _addZoom: function () {
    var template = Template.compile('\
    <a href="#zoom_in" class="zoom_in">+</a>\
    <a href="#zoom_out" class="zoom_out">-</a>\
    <div class="info"></div>', 'mustache'
    );

    var zoom = new Zoom({
      model: this.options.map,
      template: template
    });

    this.$el.append(zoom.render().$el);
    this.$el.addClass('with-zoom');
  },

  _addLoader: function () {
    var template = Template.compile('<div class="loader"></div>', 'mustache');

    this.loader = new TilesLoader({
      template: template
    });

    this.$el.append(this.loader.render().$el);
    this.$el.addClass('with-loader');
  },

  _addFullscreen: function () {
    if (this.visibility_options.fullscreen != false) {
      this.hasFullscreen = true;
      this.$el.addClass('with-fullscreen');
    }
  },

  _addSearch: function () {
    this.hasSearch = true;

    var template = Template.compile('\
      <form>\
      <span class="loader"></span>\
      <input type="text" class="text" placeholder="Search for places..." value="" />\
      <input type="submit" class="submit" value="" />\
      </form>\
      ', 'mustache'
    );

    var search = new Search({
      template: template,
      mapView: this.mapView,
      model: this.mapView.map
    });

    this.$el.find('.aside').prepend(search.render().$el);
    this.$el.find('.cartodb-searchbox').show();
    this.$el.addClass('with-search');
  },

  _addHeader: function (overlay) {
    this.hasHeader = true;

    this.$header = this.$el.find('.cartodb-header');

    var title_template = _.template('<div class="hgroup"><% if (show_title) { %><div class="title"><%= title %></div><% } %><% if (show_description) { %><div class="description"><%= description %><% } %></div></div>');

    var extra = overlay.options.extra;
    var has_header = false;
    var show_title = false, show_description = false;

    if (extra) {
      if (this.visibility_options.title || this.visibility_options.title != false && extra.show_title) {
        has_header = true;
        show_title = true;
      }

      if (this.visibility_options.description || this.visibility_options.description != false && extra.show_description) {
        has_header = true;
        show_description = true;
      }

      var $hgroup = title_template({
        title: sanitize.html(extra.title),
        show_title: show_title,
        description: sanitize.html(extra.description),
        show_description: show_description
      });

      if (has_header) {
        this.$el.addClass('with-header');
        this.$header.find('.content').append($hgroup);
      }
    }
  },

  _renderLayers: function () {
    var hasLegendOverlay = this.visibility_options.legends;

    var legends = this.layers.filter(function (layer) {
      return layer.get('legend') && layer.get('legend').type !== 'none';
    });

    var hasLegends = legends.length ? true : false;

    if (!this.hasLayerSelector && !hasLegendOverlay) return;
    if (!this.hasLayerSelector && !hasLegends) return;
    if (this.layers.length == 0) return;
    if (this.layers.length == 1 && !hasLegends) return;

    this.$el.addClass('with-layers');

    this.model.set('layer_count', 0);

    if (!this.hasSearch) this.$el.find('.aside .layer-container').prepend('<h3></h3>');

    _.each(this.layers, this._renderLayer, this);
  },

  _renderLayer: function (data) {
    var hasLegend = data.get('legend') && data.get('legend').type !== '' && data.get('legend').type !== 'none';

    // When the layer selector is disabled, don't show the layer if it doesn't have legends
    if (!this.hasLayerSelector && !hasLegend) return;
    if (!this.hasLayerSelector && !data.get('visible')) return;

    var hide_toggle = (this.layers.length == 1 || !this.hasLayerSelector);

    var show_legends = true;

    if (this.visibility_options && this.visibility_options.legends !== undefined) {
      show_legends = this.visibility_options.legends;
    }

    var layer = new MobileLayer({
      model: data,
      show_legends: show_legends,
      show_title: !this.hasLayerSelector ? false : true,
      hide_toggle: hide_toggle
    });

    this.$el.find('.aside .layers').append(layer.render().$el);

    layer.bind('change_visibility', this._reInitScrollpane, this);

    this.model.set('layer_count', this.model.get('layer_count') + 1);
  },

  render: function () {
    this._bindOrientationChange();

    this.$el.html(this.template(this.options));

    this.$header = this.$el.find('.cartodb-header');
    this.$header.show();

    this._renderOverlays();

    this._getLayers();
    this._renderLayers();

    return this;
  }
});

module.exports = Mobile;
