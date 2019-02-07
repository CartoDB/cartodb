var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var UserSettingsView = require('../public_common/user_settings_view');
var UserIndustriesView = require('../public_common/user_industries_view');
var PublicMapWindow = require('./public_map_window');
var MapCardPreview = require('../common/views/mapcard_preview');
var UserShareView = require('../public_common/user_share_view');
var UserMetaView = require('../public_common/user_meta_view');

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
    cdb.config.set(window.config);
    cdb.config.set('url_prefix', window.base_url);

    var userIndustriesView = new UserIndustriesView({
      el: $('.js-user-industries'),
    });

    var userShareView = new UserShareView({
      el: $('.js-Navmenu-share'),
      model: new cdb.core.Model({
        active: false
      })
    });

    var userMetaView = new UserMetaView({
      el: $('.js-user-meta'),
      model: new cdb.core.Model({
        active: false
      })
    });

    $(document.body).bind('click', function() {
      cdb.god.trigger('closeDialogs');
      userShareView.close();
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
          $('.js-Navmenu-editLink').addClass('is-active');
        }
      }
    });

    // More user vis cards
    $('.MapCard').each(function() {
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
