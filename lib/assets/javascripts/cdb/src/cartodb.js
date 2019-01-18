// entry point
;(function() {

    var root = this;

    var cdb = root.cdb = {};

    cdb.VERSION = "3.15.13";
    cdb.DEBUG = false;

    cdb.CARTOCSS_VERSIONS = {
      '2.0.0': '',
      '2.1.0': ''
    };

    cdb.CARTOCSS_DEFAULT_VERSION = '2.1.1';

    root.cdb.config = {};
    root.cdb.core = {};
    root.cdb.image = {};
    root.cdb.geo = {};
    root.cdb.geo.ui = {};
    root.cdb.geo.geocoder = {};
    root.cdb.ui = {};
    root.cdb.ui.common = {};
    root.cdb.vis = {};
    root.cdb.decorators = {};
    /**
     * global variables
     */
    root.JST = root.JST || {};
    root.cartodb = cdb;

    cdb.files = [
        "../vendor/jquery.min.js",
        "../vendor/underscore-min.js",
        "../vendor/json2.js",
        "../vendor/backbone.js",
        "../vendor/mustache.js",

        "../vendor/leaflet.js",
        "../vendor/wax.cartodb.js",
        "../vendor/GeoJSON.js", //geojson gmaps lib

        "../vendor/jscrollpane.js",
        "../vendor/mousewheel.js",
        "../vendor/mwheelIntent.js",
        "../vendor/spin.js",
        "../vendor/lzma.js",
        "../vendor/html-css-sanitizer-bundle.js",

        'core/sanitize.js',
        'core/decorator.js',
        'core/config.js',
        'core/log.js',
        'core/profiler.js',
        'core/template.js',
        'core/model.js',
        'core/view.js',
        'core/loader.js',
        'core/util.js',

        'geo/geocoder.js',
        'geo/geometry.js',
        'geo/map.js',
        'geo/ui/text.js',
        'geo/ui/annotation.js',
        'geo/ui/image.js',
        'geo/ui/share.js',
        'geo/ui/zoom.js',
        'geo/ui/zoom_info.js',
        'geo/ui/legend.js',
        'geo/ui/switcher.js',
        'geo/ui/infowindow.js',
        'geo/ui/header.js',
        'geo/ui/search.js',
        'geo/ui/layer_selector.js',
        'geo/ui/slides_controller.js',
        'geo/ui/mobile.js',
        'geo/ui/tiles_loader.js',
        'geo/ui/infobox.js',
        'geo/ui/tooltip.js',
        'geo/ui/fullscreen.js',

        'geo/sublayer.js',
        'geo/layer_definition.js',
        'geo/common.js',

        'geo/leaflet/leaflet_base.js',
        'geo/leaflet/leaflet_plainlayer.js',
        'geo/leaflet/leaflet_tiledlayer.js',
        'geo/leaflet/leaflet_gmaps_tiledlayer.js',
        'geo/leaflet/leaflet_wmslayer.js',
        'geo/leaflet/leaflet_cartodb_layergroup.js',
        'geo/leaflet/leaflet_cartodb_layer.js',
        'geo/leaflet/leaflet.geometry.js',
        'geo/leaflet/leaflet.js',

        'geo/gmaps/gmaps_base.js',
        'geo/gmaps/gmaps_baselayer.js',
        'geo/gmaps/gmaps_plainlayer.js',
        'geo/gmaps/gmaps_tiledlayer.js',
        'geo/gmaps/gmaps_cartodb_layergroup.js',
        'geo/gmaps/gmaps_cartodb_layer.js',
        'geo/gmaps/gmaps.geometry.js',
        'geo/gmaps/gmaps.js',

        'ui/common/dialog.js',
        'ui/common/share.js',
        'ui/common/notification.js',
        'ui/common/table.js',
        'ui/common/dropdown.js',

        'vis/vis.js',
        'vis/image.js',
        'vis/overlays.js',
        'vis/layers.js',

        // PUBLIC API
        'api/layers.js',
        'api/sql.js',
        'api/vis.js'
    ];

    cdb.init = function(ready) {
      // define a simple class
      var Class = cdb.Class = function() {};
      _.extend(Class.prototype, Backbone.Events);

      cdb._loadJST();
      root.cdb.god = new Backbone.Model();

      ready && ready();
    };

    /**
     * load all the javascript files. For testing, do not use in production
     */
    cdb.load = function(prefix, ready) {
        var c = 0;

        var next = function() {
            var script = document.createElement('script');
            script.src = prefix + cdb.files[c];
            document.body.appendChild(script);
            ++c;
            if(c == cdb.files.length) {
                if(ready) {
                    script.onload = ready;
                }
            } else {
                script.onload = next;
            }
        };

        next();

    };
})();
