var browserify = require('./browserify');

var files = {};
for (var name in browserify) {
  if (!/specs/.test(name)) {
    var dest = browserify[name].dest;
    var mapDest = dest.replace('.js', '.map');
    files[mapDest] = [dest];
  }
}

// Extracts inlined source map from files (browserify bundles in this case).
// Expected to be run after browserify task
module.exports = {
  bundle: {
    options: {
      strict: true // fail task if sourcemaps are missing
    },
    files: files
  }
};
