var $ = require('jquery');
var cdb = require('cartodb.js');
var UserSettingsView = require('../public_common/user_settings_view');
var UserIndustriesView = require('../public_common/user_industries_view');
var PublicMapWindow = require('./public_map_window');
var MapCardPreview = require('../common/views/mapcard_preview');
var LikeView = require('../common/views/likes/view');

$(function() {

  // No attributions and no links in this map (at least from cartodb)
  cartodb.config.set({
    cartodb_attributions: "",
    cartodb_logo_link: ""
  });

  $.extend( $.easing, {
    easeInQuad: function (x, t, b, c, d) {
      return c*(t/=d)*t + b;
    }
  });

  cdb.init(function() {
    cdb.templates.namespace = 'cartodb/';
    cdb.config.set('url_prefix', window.base_url);

    $(document.body).bind('click', function() {
      cdb.god.trigger('closeDialogs');
    });

    var userIndustriesView = new UserIndustriesView({
      el: $('.js-user-industries'),
    });

    var authenticatedUser = new cdb.open.AuthenticatedUser();
    authenticatedUser.bind('change', function() {
      if (authenticatedUser.get('username')) {
        var user = new cdb.admin.User(authenticatedUser.attributes);
        var userSettingsView = new UserSettingsView({
          el: $('.js-user-settings'),
          model: user
        });
        userSettingsView.render();

        if (user.get('username') === window.owner_username) {
          // Show "Edit in CartoDB" button if logged user
          // is the map owner ;)
          $('.js-editMap').addClass('is-visible');
        }

        $('.js-login').hide();
        $('.js-learn').hide();
      }
    });

    // Vis likes
    $('.js-likes').each(function() {
      var likeModel = cdb.admin.Like.newByVisData({
        likeable: false,
        vis_id: $(this).data('vis-id'),
        likes: $(this).data('likes-count')
      });
      authenticatedUser.bind('change', function() {
        if (authenticatedUser.get('username')) {
          likeModel.bind('loadModelCompleted', function() {
            likeModel.set('likeable', true);
          });
          likeModel.fetch();
        }
      });
      var likeView = new LikeView({
        el: this,
        model: likeModel
      });
      likeView.render();
    });

    // More user vis cards
    $('.MapCard').each(function() {

      var vizjson = $(this).data('vizjson-url');
      var zoom    = $(this).data('zoom');

      if (vizjson) {
        var mapCardPreview = new MapCardPreview({
          el: $(this).find('.js-header'),
          zoom: zoom,
          vizjson: vizjson
        });
        mapCardPreview.load();
      }
    });

    // Check if device is a mobile
    var mobileDevice = /Android|webOS|iPad|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Window view
    var public_window = new PublicMapWindow({
      el:                   window,
      user_name:            user_name,
      owner_username:       owner_username,
      vis_id:               vis_id,
      vis_name:             vis_name,
      vizdata:              vizdata,
      config:               config,
      map_options:          map_options,
      isMobileDevice:       mobileDevice,
      belong_organization:  belong_organization
    });
    
    authenticatedUser.fetch();
  });
});
