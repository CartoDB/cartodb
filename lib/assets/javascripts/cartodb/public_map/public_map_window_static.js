var _ = require('underscore');
var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var PublicHeaderView = require('../common/public_header_view');
var PublicMapInfoView = require('./public_map_info_static');
var PublicMapDatasets = require('./public_map_datasets_static');
var PublicMapView = require('./public_map_view_static');
var PublicNavigationView = require('../common/public_navigation_view');
var PublicFooterView = require('../common/public_footer_view');

module.exports = cdb.core.View.extend({
  events: {
    'click': '_onClick'
  },

  bindings: {
    MAP_ERROR: 'map_error'
  },

  initialize: function () {
    this._initModels();
    this._initViews();
    this._initBindings();
    this._setupMapDimensions();
    this._loadHubspotForms();
  },

  assign: function (view, selector) {
    view.setElement(this.$(selector)).render();
  },

  _initModels: function () {
    this.currentUser = this.options.currentUser;
    this.mapOwnerUser = this.options.mapOwnerUser;
    this.data = this.options.data;
    this.isHosted = cdb.config.get('cartodb_com_hosted');
    this.mapId = this.options.mapId;
    this.disqusShortname = this.currentUser
      ? this.currentUser.get('disqus_shortname')
      : null;
    this.vizdata = this.options.vizdata;
    this.visualizations = this.options.visualizations;
  },

  _initViews: function () {
    this.publicHeaderView = new PublicHeaderView({
      currentUser: this.currentUser,
      isHosted: this.isHosted
    });

    this.publicMapView = new PublicMapView({
      data: this.data,
      mapId: this.mapId,
      vizdata: this.vizdata
    });

    this.publicNavigationView = new PublicNavigationView({
      user: this.mapOwnerUser,
      currentUser: this.currentUser,
      vizdata: this.vizdata,
      vizId: this.vizdata.id,
      data: this.data
    });

    this.publicMapInfoView = new PublicMapInfoView({
      currentUser: this.currentUser,
      mapOwnerUser: this.mapOwnerUser,
      data: this.data,
      vizdata: this.vizdata,
      visualizations: this.visualizations
    });

    this.publicFooterView = new PublicFooterView({
      config: this.data.config
    });

    this.$el.append([
      this.publicHeaderView.el,
      this.publicMapView.el,
      this.publicNavigationView.el,
      this.publicMapInfoView.el,
      this.publicFooterView.el
    ]);

    this.publicHeaderView.render();
    this.publicMapView.render();
    this.publicNavigationView.render();
    this.publicMapInfoView.render();
    this.publicFooterView.render();

    return this;
  },

  _initBindings: function () {
    _.bindAll(this, '_onWindowResize', '_onOrientationChange');

    $(window).on('resize', this._onWindowResize);

    if (!this.el.addEventListener) {
      this.el.attachEvent('orientationchange',
        this._onOrientationChange, this);
    } else {
      this.el.addEventListener('orientationchange',
        this._onOrientationChange);
    }

    this.publicMapView.bind(
      this.bindings.MAP_ERROR,
      this._showNotSupportedDialog,
      this
    );

    this.currentUser && this.currentUser.bind('change', function () {
      this._addUserSettingsView();
    });
  },

  _showNotSupportedDialog: function () {
    this.$('#not_supported_dialog').show();
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
    var windowHeight = $(window).height();
    var navHeight = this.$('.js-Navmenu').height();
    var headerHeight = this.$('.Header').height();
    var landscapeMode = _isLandscapeMode.call(this);
    var height = windowHeight - _getAnimationHeight.call(this);
    var isScrollToTop = _isScrollToTop.call(this, headerHeight);
    var isMobile = this.options.isMobileDevice;

    _animateMap.call(this, isAnimated, height, windowHeight,
      navHeight, headerHeight);

    if (isMobile && landscapeMode && isScrollToTop) {
      _scrollToTop.call(this, headerHeight);
    }

    if (!this.publicMapView.vis) {
      this.publicMapView.createVis();
    }

    if (this.publicMapView) {
      this.publicMapView.invalidateMap();
    }
  },

  _loadHubspotForms: function () {
    var FORM_ID = 'newsletter';
    var hubspotToken = cdb.config.get('hubspot_token');
    var hubspotIds = cdb.config.get('hubspot_form_ids');
    var hubspotFormId = hubspotIds
      ? hubspotIds[FORM_ID]
      : null;

    if (hubspotToken && hubspotFormId && hbspt) {
      hbspt.forms.create({
        css: '.hs-form{margin-right:-20px}.hs-form fieldset{display:block;width:100%;max-width:none !important}.hs-form label{display:none}.hs-form .input{margin-right:20px !important;margin-bottom:20px}.hs-form .hs-input{width:100% !important;outline:none}.hs-form select{height:35px;border:1px solid #ccc;font-size:13px;color:#666}.hs-form input.hs-input,.hs-form textarea{border:1px solid #ddd;padding:8px 16px;transition:all .3s;font:300 14px/22px "Open Sans","Helvetica Neue",Helvetica,Arial,sans-serif;color:#999;background:#fff;border-radius:4px;box-shadow:0 2px 0 rgba(0,0,0,0.05) inset}@media (max-width: 380px){.hs-form input.hs-input,.hs-form textarea{padding:12px 16px}}.hs-form input.hs-input:focus,.hs-form textarea:focus{border-color:#ccc}.hs-form textarea{height:80px}@media (max-width: 380px){.hs-form textarea{display:none}}',
        portalId: hubspotToken,
        formId: hubspotFormId,
        submitButtonClass: 'hs-newsletter',
        target: '.js-Hubspot--newsletter',
        formInstanceId: '2'
      });
    }
  },

  _onClick: function () {
    cdb.god.trigger('closeDialogs');
  }
});

function _getWindowOffset (headerHeight, windowHeight, landscapeMode) {
  var GREAT_HEIGHT_OFFSET = 220;
  var LANDSCAPE_HEADER_OFFSET = 20;
  var MAX_WINDOW_HEIGHT = 670;
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
  var $map = this.$('#' + this.mapId);

  if (animated) {
    $map.animate({ height: height }, { easing: EASING, duration: DURATION_MS });
  } else {
    height = this.options.isMobileDevice
      ? height
      : windowHeight - (navHeight + headerHeight);

    $map.css({ height: height, opacity: OPACITY });
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

  this.$el.animate({ scrollTop: headerHeight }, SCROLL_HEIGHT);
}

function _isScrollToTop (headerHeight) {
  return $(window).scrollTop() < headerHeight;
}
