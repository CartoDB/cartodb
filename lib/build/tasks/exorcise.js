var browserifyBundles = require('../files/browserify_files');

/**
 * Extracts inlined source map from files (browserify bundles in this case).
 *
 * Expected to be run after copy:js task
 */
exports.task = function() {
  var files = {};

  for (var bundleName in browserifyBundles) {
    if (bundleName !== 'test_specs_for_browserify_modules') {
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
