var _ = require('underscore');
var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var ExportMapView = require('../common/dialogs/export_map/export_map_view');
var LikeView = require('../common/views/likes/view');
var MapCardPreview = require('../common/views/mapcard_preview');
var PublicHeaderView = require('../public/public_header_view');
var PublicMapInfoView = require('./public_map_info_static');
var PublicMapView = require('./public_map_view_static');
var PublicNavigationView = require('../public/public_navigation_view');
var UserIndustriesView = require('../public_common/user_industries_view');
var UserMetaView = require('../public_common/user_meta_view');
var UserSettingsView = require('../public_common/user_settings_view');
var UserShareView = require('../public_common/user_share_view');
var PublicFooterView = require('../public/public_footer_view');

module.exports = cdb.core.View.extend({
  events: {
    'click': '_onClick',
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
    this._loadHubspotForms();
  },

  assign: function (view, selector) {
    view.setElement(this.$(selector)).render();
  },

  _initModels: function () {
    this.currentUser = this.options.currentUser;
    this.data = this.options.data;
    this.isHosted = this.options.config.get('cartodb_com_hosted');
    this.mapId = this.options.mapId;
    this.disqusShortname = this.currentUser.get('disqus_shortname');
    this.vizdata = this.options.vizdata;
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
      user: this.currentUser,
      vizdata: this.vizdata,
      vizId: this.vizdata.id,
      data: this.data
    });

    this.publicMapInfoView = new PublicMapInfoView({
      currentUser: this.currentUser,
      data: this.data,
      vizdata: this.vizdata
    });

    this.publicFooterView = new PublicFooterView({
      config: this.data.config
    });

    this.publicMapView.bind(
      this.bindings.MAP_ERROR,
      this._showNotSupportedDialog,
      this
    );

    this.$publicHeaderView = this.publicHeaderView.render().el;
    this.$publicMapView = this.publicMapView.render().el;
    this.$publicNavigationView = this.publicNavigationView.render().el;
    this.$publicMapInfoView = this.publicMapInfoView.render().el;
    this.$publicFooterView = this.publicFooterView.render().el;

    this.userIndustriesView = new UserIndustriesView({
      el: $('.js-user-industries')
    });

    this.userShareView = new UserShareView({
      el: $('.js-Navmenu-share'),
      model: new cdb.core.Model({
        active: false
      })
    });

    this.userMetaView = new UserMetaView({
      el: $('.js-user-meta'),
      model: new cdb.core.Model({
        active: false
      })
    });

    if (this.currentUser.get('username')) {
      this.userSettingsView = new UserSettingsView({
        el: $('.js-user-settings'),
        model: this.currentUser
      });

      this.userSettingsView.render();

      if (this.currentUser.get('username') === window.owner_username) {
        $('.js-Navmenu-editLink').addClass('is-active');
      }

      this.currentUser.fetch();
    }

    $('.js-likes').each(function () {
      _addLikeView.call(this);
    });

    $('.MapCard').each(function () {
      _addMapcardPreview.call(this);
    });

    this.$el.append([
      this.$publicHeaderView,
      this.$publicMapView,
      this.$publicNavigationView,
      this.$publicMapInfoView,
      this.$publicFooterView
    ]);

    return this;
  },

  _initBinds: function () {
    _.bindAll(this, '_onWindowResize', '_onOrientationChange');

    $(window).on('resize', this._onWindowResize);

    if (!this.el.addEventListener) {
      this.el.attachEvent('orientationchange',
        this._onOrientationChange, this);
    } else {
      this.el.addEventListener('orientationchange',
        this._onOrientationChange);
    }

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

    this.$map = this.$map || this.$('#' + this.mapId);

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

  _exportMap: function (event) {
    event.preventDefault();

    var mapModel = new cdb.admin.ExportMapModel({
      visualization_id: this.vizdata.id
    });

    var $mapView = new ExportMapView({
      model: mapModel,
      clean_on_hide: true,
      enter_to_confirm: true
    });

    $mapView.appendToBody();
  },

  _loadHubspotForms: function () {
    var FORM_ID = 'newsletter';
    var hubspotIds = this.options.config.get('hubspot_ids');
    var hubspotFormId = hubspotIds
      ? JSON.parse(hubspotIds)[FORM_ID]
      : null;

    var hubspotToken = this.options.config.get('hubspot_token');

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

  this.$el.animate({ scrollTop: headerHeight }, SCROLL_HEIGHT);
}

function _isScrollToTop (headerHeight) {
  return $(window).scrollTop() < headerHeight;
}

function _addLikeView () {
  var likeModel = cdb.admin.Like.newByVisData({
    likeable: true,
    liked: $(this).data('liked'),
    vis_id: $(this).data('vis-id'),
    likes: $(this).data('likes-count'),
    size: $(this).data('likes-size')
  });

  var likeView = new LikeView({
    el: this,
    model: likeModel
  });

  likeView.render();
}

function _addMapcardPreview () {
  var visId = $(this).data('visId');
  if (visId) {
    var username = $(this).data('visOwnerName');
    var mapCardPreview = new MapCardPreview({
      el: $(this).find('.js-header'),
      visId: $(this).data('visId'),
      username: username,
      mapsApiResource: cdb.config.getMapsResourceName(username)
    });
    mapCardPreview.load();
  }
}
