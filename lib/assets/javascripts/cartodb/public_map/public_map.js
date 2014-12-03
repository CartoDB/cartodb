
  /**
   *  Necessary tasks for public map(vis) view
   *
   */


  $(function() {

    $(".js-like").on("click", function(e) {

      e.preventDefault();
      e.stopPropagation();

      var $el    = $(this);
      var vis_id = $el.attr("data-id");
      var liked  = parseInt($el.attr("data-liked"), 10);

      var url    = "/api/v1/viz/" + vis_id + "/like";

      if (cdb.config.isOrganizationUrl()) {
        url  = cdb.config.organizationUrl() + "/api/v1/viz/" + vis_id + "/like";
      }

      if (liked) {
        unlike($el, url);
      } else {
        like($el, url);
      }

    });

    $.extend( $.easing, {
      easeInQuad: function (x, t, b, c, d) {
        return c*(t/=d)*t + b;
      }
    });

    cdb.init(function() {
      cdb.config.set(config);
      if (cdb.config.isOrganizationUrl()) cdb.config.set('url_prefix', cdb.config.organizationUrl());
      cdb.templates.namespace = 'cartodb/';

      // No attributions and no links in this map (at least from cartodb)
      cartodb.config.set({
        cartodb_attributions: "",
        cartodb_logo_link: ""
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
