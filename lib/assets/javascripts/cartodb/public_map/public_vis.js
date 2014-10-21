
  /** 
   *  Public vis (map itself)
   *
   */

  cdb.open.PublicVis = cdb.core.View.extend({

    initialize: function() {
      this._createVis();
    },

    _createVis: function() {

    }

  })



// $(window).trigger('resize') // When vis is loaded :S


/**

  
    // Get url parameters
    function get_url_params(conversion) {

      conversion = conversion || {};

      var tokens = location.search.slice(1).split('&');
      var params = {};

      for (var i = 0; i < tokens.length; ++i) {

        var tk = tokens[i].split('=');
        var fn = conversion[tk[0]] || function(v) { return v };

        if (tk.length === 2) {
          params[tk[0]] = fn(decodeURIComponent(tk[1]));
        }
      }

      return params;
    }

    // Manage error
    function manageError(err, layer) {
      if(layer && layer.get('type') === 'torque') {
        $('#not_supported_dialog').show();
        // hide all the overlays
        var overlays = vis.getOverlays()
        for (var i = 0; i < overlays.length; ++i) {
          var o = overlays[i];
          o.hide && o.hide();
        }
      }
    }

    // Send stats
    function stats() {
      var browser;
      var ua = navigator.userAgent;
      var checks = [
        ['MSIE 11.0', 'ms11'],
        ['MSIE 10.0', 'ms10'],
        ['MSIE 9.0', 'ms9'],
        ['MSIE 8.0', 'ms8'],
        ['MSIE 7.0','ms7'],
        ['Chrome', 'chr'],
        ['Firefox', 'ff'],
        ['Safari', 'ff']
      ]
      for(var i = 0; i < checks.length && !browser; ++i) {
        if(ua.indexOf(checks[i][0]) !== -1) browser = checks[i][1];
      }
      browser = browser || 'none';
      cartodb.core.Profiler.metric('cartodb-js.embed.' + browser).inc();
    }


    // When ready...
    $(function() {

      var bool_fn = function(v) { return v == 'true' };
      var is_custom_install = <%= Cartodb.config[:cartodb_com_hosted].present? %>;
      var logo_fn  = function(v) { return ( <%= !@visualization.user.remove_logo? %> || is_custom_install ) ? true : v == 'true' };
      var layer_fn = function(v) {
        if (!v || !v.length) {
          return null;
        }

        return _.map(v.split("|"), function(v) {
          return { visible: !!parseInt(v, 10) }
        });

      };

      var opt = get_url_params({
        'search':       bool_fn,
        'title':        bool_fn,
        'description':  bool_fn,
        'shareable':    bool_fn,
        'fullscreen':   bool_fn,
        'cartodb_logo': bool_fn,
        'scrollwheel':  bool_fn,
        'sublayer_options': layer_fn,
        'layer_selector': bool_fn,
        'legends': bool_fn
      });

      <% if (@visualization.password_protected? or @visualization.organization?) and @protected_map_tokens %>
          opt.auth_token = [];
          <% @protected_map_tokens.each do |token| %>
              opt.auth_token.push('<%= token %>');
          <% end %>
          opt.https = true; // when auth_token is used tiles should be fetch using https
      <% end %>

      <% if Rails.env.development? || Cartodb.config[:no_cdn] == true %>
          opt.no_cdn = true;
      <% end %>

      var scrollwheelEnabled = opt.scrollwheel;

      // Logo MUST be hidden in this view
      opt.cartodb_logo  = false;
      opt.scrollwheel   = false;
      opt.mobile_layout = true;

      cartodb.config.set({
        cartodb_attributions: "",
        cartodb_logo_link: ""
      });

      var loadingTime  = cartodb.core.Profiler.metric('cartodb-js.embed.time_full_loaded').start();
      var visReadyTime = cartodb.core.Profiler.metric('cartodb-js.embed.time_vis_loaded').start();

 

      cartodb.createVis('map', <%=raw @visualization.to_vizjson.to_json %>, opt, function(vis) {

        visReadyTime.end();

        vis.on('load', function() {
          loadingTime.end();
        });

        window.vis = vis;

        var fullscreen = vis.getOverlay("fullscreen");

        if (fullscreen) {

          fullscreen.options.doc = ".cartodb-public-wrapper";
          fullscreen.model.set("allowWheelOnFullscreen", scrollwheelEnabled);

        }

        // some stats
        stats();



      }).on('error', manageError);
    });



 */
