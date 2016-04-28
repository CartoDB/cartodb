var bundles = require('../files/browserify_files');

module.exports = {
  task: function () {
    var cfg = {};
    for (var name in bundles) {
      var bundle = bundles[name];

      var options = {
        transform: [],

        // enables watchify when grunt is run with a watch task, e.g. `grunt dev`
        // must be evaluated lazily (using template var) to allow override by setConfig task.
        watch: '<%= env.browserify_watch %>',

        browserifyOptions: {
          debug: true
        },

        plugin: [
          ['browserify-resolutions', ['backbone', 'carto', 'cartodb.js', 'd3', 'jquery', 'jquery-ui', 'torque.js']]
        ]
      };

      if (bundle.options) {
        if (bundle.options.transform) {
          options.transform = options.transform.concat(bundle.options.transform);
        }
      }

      cfg[name] = {
        options: options,
        src: bundle.src,
        dest: bundle.dest || ('<%= assets_dir %>/javascripts/' + name + '.js')
      };
    }

    return cfg;
  }
};
