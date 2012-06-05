// entry point
(function() {
    window.cdb = {};
    window.cdb.config = {};
    window.cdb.core = {};
    window.cdb.geo = {};

    cdb.files = [
        "lib/jquery.min.js",
        "lib/underscore-min.js",
        "lib/backbone-min.js",

        "lib/leaflet.js",

        'core/config.js',
        'core/log.js',
        'core/view.js',

        'geo/map.js'
    ];

    /**
     * load all the javascript files. For testing, do not use in production
     */
    cdb.load = function(prefix, ready) {
        var c = 0;

        var _ready = function() {
            ++c;
            if(c == cdb.files.length) {
                if(ready)
                    ready();
            }

        };

        for(var i in cdb.files) {
            var script = document.createElement('script');
            script.src = prefix + cdb.files[i];
            script.onload = _ready;
            document.body.appendChild(script);
        }
    };
})();
