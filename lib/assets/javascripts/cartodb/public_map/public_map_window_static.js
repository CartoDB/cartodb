var _ = require('underscore-cdb-v3');
var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var PublicHeaderView = require('../common/public_header_view');
var PublicMapInfoView = require('./public_map_info_static');
var PublicMapView = require('./public_map_view_static');
var PublicNavigationView = require('../common/public_navigation_view');
var PublicFooterView = require('../common/public_footer_view');
var UserSettingsView = require('../public_common/user_settings_view');

function _getWindowOffset (headerHeight, windowHeight, landscapeMode) {
  var GREAT_HEIGHT_OFFSET = 220;
  var LANDSCAPE_HEADER_OFFSET = 20;
  var MAX_WINDOW_HEIGHT = 670;
  var SMALL_HEIGHT_OFFSET = 140;

  return landscapeMode
    ? headerHeight - LANDSCAPE_HEADER_OFFSET
    : windowHeight > MAX_WINDOW_HEIGHT ? GREAT_HEIGHT_OFFSET : SMALL_HEIGHT_OFFSET;
}

function _isLandscapeMode (el) {
  return el.matchMedia && el.matchMedia('(orientation: landscape)').matches;
}

function _animateMap (el, animated, height, windowHeight, navHeight, headerHeight, isMobile) {
  var DURATION_MS = 150;
  var EASING = 'easeInQuad';
  var OPACITY = 1;

  if (animated) {
    el.animate({ height: height }, { easing: EASING, duration: DURATION_MS });
  } else {
    height = isMobile
      ? height
      : windowHeight - (navHeight + headerHeight);

    el.css({ height: height, opacity: OPACITY });
  }
}

function _getAnimationHeight (isMobile, headerHeight, windowHeight, landscapeMode) {
  var LANSCAPE_OFFSET = 260;

  return isMobile
    ? _getWindowOffset(headerHeight, windowHeight, landscapeMode)
    : LANSCAPE_OFFSET;
}

function _scrollToTop (el, headerHeight) {
  var SCROLL_HEIGHT = 600;

  el.animate({ scrollTop: headerHeight }, SCROLL_HEIGHT);
}

function _isScrollToTop (headerHeight) {
  return $(window).scrollTop() < headerHeight;
}

module.exports = cdb.core.View.extend({
  events: {
    'click': '_onClick'
  },

  bindings: {
    MAP_ERROR: 'map_error',
    CHANGE: 'change'
  },

  initialize: function () {
    _.bindAll(this, '_onWindowResize', '_onOrientationChange');
    this._initModels();
  },

  render: function () {
    this._initViews();
    this._initBindings();
    this._setupMapDimensions();
    this._loadHubspotForms();

    return this;
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
    this.addView(this.publicHeaderView);

    this.publicMapView = new PublicMapView({
      data: this.data,
      mapId: this.mapId,
      vizdata: this.vizdata,
      password: this.options.password,
      mapOwnerUser: this.mapOwnerUser,
      isInsideOrg: this.mapOwnerUser.isInsideOrg()
    });
    this.addView(this.publicMapView);

    this.publicNavigationView = new PublicNavigationView({
      user: this.mapOwnerUser,
      currentUser: this.currentUser,
      vizdata: this.vizdata,
      vizId: this.vizdata.id,
      data: this.data
    });
    this.addView(this.publicNavigationView);

    this.publicMapInfoView = new PublicMapInfoView({
      currentUser: this.currentUser,
      mapOwnerUser: this.mapOwnerUser,
      data: this.data,
      vizdata: this.vizdata,
      visualizations: this.visualizations
    });
    this.addView(this.publicMapInfoView);

    this.publicFooterView = new PublicFooterView({
      config: this.data.config
    });
    this.addView(this.publicFooterView);

    this.$el.append([
      this.publicHeaderView.render().el,
      this.publicMapView.render().el,
      this.publicNavigationView.render().el,
      this.publicMapInfoView.render().el,
      this.publicFooterView.render().el
    ]);
  },

  _initBindings: function () {
    $(window).on('resize', this._onWindowResize);
    this.el.addEventListener('orientationchange', this._onOrientationChange);

    this.publicMapView.bind(
      this.bindings.MAP_ERROR,
      this._showNotSupportedDialog,
      this
    );
    this.add_related_model(this.publicMapView);

    if (this.currentUser) {
      this.currentUser.bind(
        this.bindings.CHANGE,
        this._addUserSettingsView,
        this
      );
      this.add_related_model(this.currentUser);
    }
  },

  _addUserSettingsView: function () {
    if (this.currentUser.get('username')) {
      var userSettingsView = new UserSettingsView({
        el: $('.js-user-settings'),
        model: this.currentUser
      });
      userSettingsView.render();

      if (this.currentUser.get('username') === this.mapOwnerUser) {
        // Show "Edit in CartoDB" button if logged user
        // is the map owner ;)
        $('.js-Navmenu-editLink').addClass('is-active');
      }
    }
  },

  _showNotSupportedDialog: function () {
    this.$('#not_supported_dialog').show();
  },

  _onWindowResize: function () {
    this._setupMapDimensions();
    cdb.god.trigger('closeDialogs');
  },

  _onOrientationChange: function () {
    var disqus = window.DISQUS;
    disqus && disqus.reset({ reload: true });
    this._setupMapDimensions(true);
  },

  _setupMapDimensions: function (isAnimated) {
    var windowHeight = $(window).height();
    var navHeight = this.$('.js-Navmenu').height();
    var headerHeight = this.$('.Header').height();
    var landscapeMode = _isLandscapeMode(this.el);
    var isMobile = this.options.isMobileDevice;
    var height = windowHeight - _getAnimationHeight(isMobile, headerHeight, windowHeight, landscapeMode);
    var isScrollToTop = _isScrollToTop(headerHeight);

    _animateMap(this.$('#' + this.mapId), isAnimated, height, windowHeight, navHeight, headerHeight, isMobile);

    if (isMobile && landscapeMode && isScrollToTop) {
      _scrollToTop(this.$el, headerHeight);
    }

    if (!this.publicMapView.vis) {
      this.publicMapView._createVis();
    }

    if (this.publicMapView) {
      this.publicMapView._invalidateMap();
    }
  },

  _loadHubspotForms: function () {
    var FORM_ID = 'newsletter';
    var hubspotToken = cdb.config.get('hubspot_token');
    var hubspotIds = cdb.config.get('hubspot_form_ids');
    var hubspotFormId = hubspotIds
      ? hubspotIds[FORM_ID]
      : null;
    var hbspt = window.hbspt;

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
  },

  clean: function () {
    $(window).off('resize', this._onWindowResize);
    this.el.removeEventListener('orientationchange', this._onOrientationChange);
    cdb.core.View.prototype.clean.call(this);
  }
});
