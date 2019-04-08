/**
 *  Concat assets generation task
 */

var srcToDestHash = function (files, basePath, fileExt) {
  var hash = {};
  for (var f in files) {
    if (f[0] !== '_') {
      hash[basePath + f + fileExt] = files[f];
    }
  }
  return hash;
};

exports.task = function () {
  return {
    js: {
      files: srcToDestHash(require('../files/js_files'), '<%= editor_assets_dir %>/javascripts/', '.js')
    },
    css: {
      files: srcToDestHash(require('../files/css_files'), '<%= editor_assets_dir %>/stylesheets/', '.css')
    }
  };
};
