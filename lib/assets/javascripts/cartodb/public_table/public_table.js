/**
 *  entry point for public table view
 */


$(function() {

  // Add easeinquad animation
  $.extend( $.easing, {
    easeInQuad: function (x, t, b, c, d) {
      return c*(t/=d)*t + b;
    }
  })

  cdb.init(function() {
    cdb.config.set(config);
    if (api_key) cdb.config.set("api_key", api_key);
    cdb.config.set('url_prefix', window.base_url);
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
      vizjson: vizjson_obj,
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