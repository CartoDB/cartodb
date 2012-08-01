// entry point
(function() {
    window.cdb = {};
    window.cdb.config = {};
    window.cdb.core = {};
    window.cdb.geo = {};
    window.cdb.geo.ui = {};
    window.cdb.ui = {};
    window.cdb.ui.common = {};

    /**
     * global variables
     */
    window.JST = window.JST || {};

    cdb._loadJST();

    cdb.files = [
        "../vendor/jquery.min.js",
        "../vendor/underscore-min.js",
        "../vendor/backbone.js",

        "../vendor/leaflet.js",
        "../vendor/wax.leaf.min-6.2.3-touched.js",

        'core/config.js',
        'core/log.js',
        'core/profiler.js',
        'core/template.js',
        'core/view.js',

        'geo/map.js',
        'geo/ui/zoom.js',
        'geo/ui/legend.js',
        'geo/ui/switcher.js',
        'geo/ui/selector.js',
        'geo/ui/infowindow.js',

        'ui/common/dialog.js',
        'ui/common/notification.js',
        'ui/common/table.js'
    ];

    cdb.init = function(ready) {
      // define a simple class
      var Class = cdb.Class = function() {};
      _.extend(Class.prototype, Backbone.Events);

      window.cdb.god = new Backbone.Model();

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
