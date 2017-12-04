var jsBundles = require('../files/js_files');
var browserifyBundles = require('../files/browserify_files');
var _ = require('underscore');

exports.task = function () {
  var js = {};
  var bundleName;
  var excludedBundles = [
    'test_specs_for_browserify_modules',
    'dashboard_static',
    'profile_static',
    'show_static',
    'public_map_static',
    'embed_map_static',
    'account_static'
  ];

  // Files to be uglified that are created outside of this process
  var files = [
    'templates',
    'templates_mustache'
  ];

  for (var i in files) {
    var f = files[i];

    if (f[0] !== '_' && f !== 'all') {
      js['<%= assets_dir %>/javascripts/' + f + '.js'] = ['<%= assets_dir %>/javascripts/' + f + '.uncompressed.js'];
    }
  }

  // Bundle definitions, concat'ed and uglified in one go
  for (bundleName in jsBundles) {
    var src = jsBundles[bundleName];
    if (bundleName[0] !== '_' && bundleName !== 'all') {
      js['<%= assets_dir %>/javascripts/' + bundleName + '.js'] = src;
    }
  }

  var defaultOptions = {
    sourceMap: true,
    banner: '/*! v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */'
  };

  var cfg = {
    production: {
      options: _.extend({
        sourceMapIncludeSources: true
      }, defaultOptions),
      files: js
    }
  };

  // Uglify browserify bundles too, but maintain original sourcemaps (expected to be extracted by 'exorcise' task, prior to this task)
  for (bundleName in browserifyBundles) {
    if (!_.contains(excludedBundles, bundleName)) {
      files = {};
      var basePath = '<%= assets_dir %>/javascripts/' + bundleName;
      var filePath = basePath + '.uncompressed.js';
      files[basePath + '.js'] = [filePath];

      cfg[bundleName] = {
        options: _.extend({
          sourceMapIn: filePath + '.map'
        }, defaultOptions),
        files: files
      };
    }
  }

  return cfg;
};
