var bundles = require('./_browserify-bundles');

// Extracts inlined source map from files (browserify bundles in this case).
// Expected to be run after browserify task
exports.task = function() {
  var files = {};

  for (var bundleName in bundles) {
    if (!/tmp|specs/.test(bundleName)) {
      var bundleDest = bundles[bundleName].dest;
      var mapDest = bundleDest.replace('.js', '.map');
      files[mapDest] = bundleDest;
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
