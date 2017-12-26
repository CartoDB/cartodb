var browserifyBundles = require('../files/browserify_files');
var _ = require('underscore');

/**
 * Extracts inlined source map from files (browserify bundles in this case).
 *
 * Expected to be run after copy:js task
 */
exports.task = function () {
  var excludedBundles = [
    'test_specs_for_browserify_modules',
    'dashboard_static',
    'show_static',
    'public_map_static'
  ];
  var files = {};

  for (var bundleName in browserifyBundles) {
    if (!_.contains(excludedBundles, bundleName)) {
      var filePath = '<%= assets_dir %>/javascripts/' + bundleName + '.uncompressed.js';
      files[filePath + '.map'] = filePath;
    }
  }

  return {
    bundle: {
      options: {
        strict: true // fail task if sourcemaps are missing
      },
      files: files
    }
  };
};
