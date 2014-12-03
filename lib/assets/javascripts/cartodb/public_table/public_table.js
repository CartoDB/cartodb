/**
 *  entry point for public table view
 */


$(function() {

  $(".js-like").on("click", function(e) {

    e.preventDefault();
    e.stopPropagation();

    var $el    = $(this);
    var vis_id = $el.attr("data-id");
    var liked  = parseInt($el.attr("data-liked"), 10);

    var url  = "/api/v1/viz/" + vis_id + "/like";

    if (cdb.config.isOrganizationUrl()) {
      url  = cdb.config.organizationUrl() + "/api/v1/viz/" + vis_id + "/like";
    }

    if (liked) {
      unlike($el, url);
    } else {
      like($el, url);
    }

  });

  // Add easeinquad animation
  $.extend( $.easing, {
    easeInQuad: function (x, t, b, c, d) {
      return c*(t/=d)*t + b;
    }
  })

  cdb.init(function() {
    cdb.config.set(config);
    if (api_key) cdb.config.set("api_key", api_key);
    if (cdb.config.isOrganizationUrl()) cdb.config.set('url_prefix', cdb.config.organizationUrl());
    cdb.templates.namespace = 'cartodb/';

    // Check if device is a mobile
    var mobileDevice = /Android|webOS|iPad|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Window view
    var public_window = new cdb.open.PublicTableWindow({
      el: window,
      table_id: table_id, 
      table_name: table_name,
      user_name: user_name,
      owner_username: owner_username,
      vizjson: vizjson,
      auth_token: auth_token,
      https: use_https,
      api_key: api_key,
      schema: schema,
      config: config,
      isMobileDevice: mobileDevice,
      belong_organization: belong_organization
    });

  });

});
