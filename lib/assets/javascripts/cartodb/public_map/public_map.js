
  /**
   *  Necessary tasks for public map(vis) view
   *
   */


  $(function() {

    $.extend( $.easing, {
      easeInQuad: function (x, t, b, c, d) {
        return c*(t/=d)*t + b;
      }
    });

    cdb.init(function() {
      cdb.config.set(config);
      cdb.templates.namespace = 'cartodb/';

      // No attributions and no links in this map (at least from cartodb)
      cartodb.config.set({
        cartodb_attributions: "",
        cartodb_logo_link: "",
        url_prefix: base_url
      });

      // Check if device is a mobile
      var mobileDevice = /Android|webOS|iPad|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // Window view
      var public_window = new cdb.open.PublicMapWindow({
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
    });
  });
