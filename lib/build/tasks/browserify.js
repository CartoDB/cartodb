var bundles = require('../files/browserify_files');

module.exports = {
  task: function () {
    var cfg = {};
    for (var name in bundles) {
      var bundle = bundles[name];
      var options = {
        transform: [
          [
            'stringify', {
              appliesTo: {
                includeExtensions: ['.mustache']
              }
            }
          ],
          [
            'babelify', {
              'presets': ['es2015'],
              'extensions': ['.babel']
            }
          ]
        ],

        // enables watchify when grunt is run with a watch task
        // must be evaluated lazily (using template var) to allow override by setConfig task.
        watch: '<%= env.browserify_watch %>',

        browserifyOptions: {
          debug: true,
          cache: {}
        }
      };

      if (bundle.options) {
        if (bundle.options.transform) {
          options.transform = options.transform.concat(bundle.options.transform);
        }
        if (bundle.options.external) {
          options.external = bundle.options.external;
        }
        if (bundle.options.require) {
          options.require = bundle.options.require;
        }
        if (bundle.options.plugin) {
          options.plugin = bundle.options.plugin;
        }
        if (bundle.options.cache) {
          options.cache = bundle.options.cache;
        }
      }

      cfg[name] = {
        src: bundle.src,
        dest: bundle.dest || ('<%= editor_assets_dir %>/javascripts/' + name + '.js'),
        options: options
      };
    }

    return cfg;
  }
};
