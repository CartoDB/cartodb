var $ = require('jquery-cdb-v3');
var _ = require('underscore');
var cdb = require('cartodb.js-v3');
var PublicMapView = require('./public_map_view_static');
var PublicHeaderView = require('../public/public_header_view');
var PublicNavigationView = require('../public/public_navigation_view');
var ExportMapView = require('../common/dialogs/export_map/export_map_view');

module.exports = cdb.core.View.extend({

  events: {
    'click .js-Navmenu-link--download-map': '_exportMap'
  },

  bindings: {
    MAP_ERROR: 'map_error'
  },

  initialize: function () {
    this._initModels();
    this._initViews();
    this._initBinds();
    this._setupMapDimensions();
  },

  _initModels: function () {
    this.$app = $('#app');
    this.currentUser = this.options.currentUser;
    this.el = this.options.el;
    this.isHosted = this.options.config.get('cartodb_com_hosted');
    this.mapId = this.options.mapId;
    this.vizdata = this.options.vizdata;
    this.data = this.options.data;
    this.vizId = this.options.vizdata.id;
  },

  _initViews: function () {
    this.template = cdb.templates.getTemplate('public_map/views/public_map');

    this.$el.html(this.template({
      mapId: this.mapId
    }));

    this.publicHeaderView = new PublicHeaderView({
      currentUser: this.currentUser,
      isHosted: this.isHosted
    });

    this.publicMapView = new PublicMapView({
      mapId: this.mapId,
      data: this.data,
      vizdata: this.vizdata
    });

    this.publicNavigationView = new PublicNavigationView();

    this.$app.append(this.publicHeaderView.render().$el);
    this.$app.append(this.publicMapView.$el);
    this.$app.append(this.publicNavigationView.render().$el);

    this.$map = this.$app.find('#' + this.mapId);

    this.publicMapView.bind(
      this.bindings.MAP_ERROR,
      this._showNotSupportedDialog,
      this
    );

    return this;
  },

  _initBinds: function () {
    _.bindAll(this, '_onWindowResize', '_onOrientationChange');
    this.$el.on('resize', this._onWindowResize);

    if (!this.el.addEventListener) {
      this.el.attachEvent('orientationchange', this._onOrientationChange, this);
    } else {
      this.el.addEventListener('orientationchange', this._onOrientationChange);
    }
  },

  _showNotSupportedDialog: function () {
    this.$app.find('#not_supported_dialog').show();
  },

  _onWindowResize: function () {
    this._setupMapDimensions();
    cdb.god.trigger('closeDialogs');
  },

  _onOrientationChange: function () {
    DISQUS && DISQUS.reset({ reload: true });
    this._setupMapDimensions(true);
  },

  _setupMapDimensions: function (isAnimated) {
    var windowHeight = this.$el.height();
    var navHeight = this.$app.find('.js-Navmenu').height();
    var headerHeight = this.$app.find('.Header').height();
    var landscapeMode = _isLandscapeMode.call(this);
    var height = windowHeight - _getAnimationHeight.call(this);
    var isScrollToTop = _isScrollToTop.call(this, headerHeight);
    var isMobile = this.options.isMobileDevice;

    _animateMap.call(this, isAnimated, height, windowHeight, navHeight, headerHeight);

    if (isMobile && landscapeMode && isScrollToTop) {
      _scrollToTop.call(this, headerHeight);
    }

    if (this.map_view) {
      this.map_view.invalidateMap();
    }
  },

  _exportMap: function (event) {
    event.preventDefault();

    var view = new ExportMapView({
      model: new cdb.admin.ExportMapModel({ 'visualization_id': this.vizId }), // FIXME
      clean_on_hide: true,
      enter_to_confirm: true
    });

    view.appendToBody();
  }
});

function _getWindowOffset (headerHeight, windowHeight, landscapeMode) {
  var LANDSCAPE_HEADER_OFFSET = 20;
  var MAX_WINDOW_HEIGHT = 670;
  var GREAT_HEIGHT_OFFSET = 220;
  var SMALL_HEIGHT_OFFSET = 140;

  return landscapeMode
    ? headerHeight - LANDSCAPE_HEADER_OFFSET
    : windowHeight > MAX_WINDOW_HEIGHT ? GREAT_HEIGHT_OFFSET : SMALL_HEIGHT_OFFSET;
}

function _isLandscapeMode () {
  return this.el.matchMedia && this.el.matchMedia('(orientation: landscape)').matches;
}

function _animateMap (animated, height, windowHeight, navHeight, headerHeight) {
  var DURATION_MS = 150;
  var EASING = 'easeInQuad';
  var OPACITY = 1;

  if (animated) {
    this.$map.animate({ height: height }, { easing: EASING, duration: DURATION_MS });
  } else {
    height = this.options.isMobileDevice
      ? height
      : windowHeight - (navHeight + headerHeight);

    this.$map.css({ height: height, opacity: OPACITY });
  }
}

function _getAnimationHeight () {
  var LANSCAPE_OFFSET = 260;

  return this.options.isMobileDevice
    ? _getWindowOffset.call(this)
    : LANSCAPE_OFFSET;
}

function _scrollToTop (headerHeight) {
  var SCROLL_HEIGHT = 600;

  this.$app.animate({ scrollTop: headerHeight }, SCROLL_HEIGHT);
}

function _isScrollToTop (headerHeight) {
  return $(this.el).scrollTop() < headerHeight;
}
