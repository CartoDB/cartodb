var cdb = require('cartodb.js-v3');
var EmbedMapContentView = require('./embed_map_content_view');
var VendorScriptsView = require('../common/vendor_scripts_view');

module.exports = cdb.core.View.extend({
  initialize: function () {
    this._initModels();
    this._initViews();
  },

  _initModels: function () {
    this.user = this.options.user;
    this.viz = this.options.viz;
  },

  _initViews: function () {
    var embedMapContentView = new EmbedMapContentView({
      viz: this.viz
    });
    this.$('#app').append(embedMapContentView.render().el);

    // var embedMapInlineJsView = new EmbedMapInlineJsView({
    //   viz: this.viz
    // });
    // this.$el.append(vendorScriptsView.render().el);

    var vendorScriptsView = new VendorScriptsView({
      config: this.options.config,
      assetsVersion: this.options.assetsVersion,
      user: this.user,
      trackjsAppKey: 'embeds',
      googleAnalyticsTrack: 'embeds',
      googleAnalyticsPublicView: true
    });
    this.$el.append(vendorScriptsView.render().el);

    return this;
  }
});




    // function getUrlParams (conversion) {
    //   conversion = conversion || {};

    //   var tokens = location.search.slice(1).split('&');
    //   var params = {};

    //   for (var i = 0; i < tokens.length; ++i) {

    //     var tk = tokens[i].split('=');
    //     var fn = conversion[tk[0]] || function(v) { return v };

    //     if (tk.length === 2) {
    //       params[tk[0]] = fn(decodeURIComponent(tk[1]));
    //     }
    //   }

    //   return params;
    // }

    // function isLogoHidden (vis, parameters)
    //   has_logo  = vis.overlays.any? {|o| o.type == "logo" }
    //   (!has_logo && vis.user.remove_logo? && (!parameters['cartodb_logo'] || parameters['cartodb_logo'] != "true")) || (has_logo && vis.user.remove_logo? && (parameters["cartodb_logo"] == 'false'))
    // end

    // function addStyleString (str) {
    //   var s = document.createElement('style');
    //   s.innerHTML = str;
    //   document.body.appendChild(s);
    // }
