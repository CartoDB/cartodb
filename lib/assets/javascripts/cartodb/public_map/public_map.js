
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
      if (cdb.config.isOrganizationUrl()) cdb.config.set('url_prefix', cdb.config.organizationUrl());
      cdb.templates.namespace = 'cartodb/';

      // Check if device is a mobile
      var mobileDevice = /Android|webOS|iPad|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // Window view
      var public_window = new cdb.open.PublicMapWindow({
        el:                   window,
        user_name:            user_name,
        owner_username:       owner_username,
        vis_id:               vis_id,
        vis_name:             vis_name,
        config:               config,
        isMobileDevice:       mobileDevice,
        belong_organization:  belong_organization
      });
    });
  });