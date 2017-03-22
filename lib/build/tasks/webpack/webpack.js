var webpack = require('webpack');
var _ = require('underscore');
var colors = require('colors');
var pretty = require('prettysize');
var glob = require('glob');
var StatsWriterPlugin = require('webpack-stats-plugin').StatsWriterPlugin;
var retrieveAffectedSpecs = require('../../affectedSpecs');
var cfg = require('./webpack.config.js').task();

var compiler = {};
var affectedSpecs = [];
var cache = {};
var paths = {
  builder_specs: './lib/assets/core/test/spec/cartodb3/**/*.spec.js'
};

/**
 * affected - To be used as part of a 'registerTask' Grunt definition
 */
var affected = function (grunt) {
    var done = this.async();

    affectedSpecs = [
      './lib/build/source-map-support.js',
      './lib/assets/core/javascripts/cartodb3/components/form-components/index.js'
    ];

    if (grunt.option('specs') === 'all') {
      var allSpecs = glob.sync(paths.builder_specs);
      console.log(colors.yellow('All specs. ' + allSpecs.length + ' specs found.'));
      affectedSpecs = affectedSpecs.concat(allSpecs);
      done();
    } else {
      retrieveAffectedSpecs(grunt)
        .then(function (specsList) {
          console.log(colors.yellow(specsList.length + ' specs found.'));
          affectedSpecs = affectedSpecs.concat(specsList);
          done();
        })
        .catch(function (reason) {
          throw new Error(reason);
        });
    }
}

var bootstrap = function (config, grunt) {
  if (!config) {
    throw new Error('Please provide subconfiguration key for webpack.');
  }

  if (!cfg[config]) {
    throw new Error(config + ' section needed in webpack.config.js');
  }

  cfg[config].entry = function () {
    return affectedSpecs;
  }

  compiler[config] = webpack(cfg[config]);
  cache[config] = {};
  compiler[config].apply(new webpack.CachePlugin(cache[config]));

  // Flag stats === true -> write stats.json
  if (grunt.option('stats')) {
    compiler[config].apply(new StatsWriterPlugin({
      transform: function(data, opts) {
        let stats = opts.compiler.getStats().toJson({chunkModules: true});
        return JSON.stringify(stats, null, 2); 
      }
    }));
  }
};

function logAssets(assets) {
  _.each(assets, function (asset) {
    var trace = asset.name;
    trace += ' ' + pretty(asset.size);
    console.log(colors.yellow(trace));
  });
}

/**
 * compile - To be used as part of a 'registerTask' Grunt definition
 */
var compile = function (config) {
  if (!config) {
    throw new Error('Please provide subconfiguration key for webpack.');
  }

  var done = this.async();

    compiler[config].run(function (err, stats) {
    if (err) {
      console.error(err.stack || err);
      if (err.details) {
        console.error(err.details);
      }
      done();
      return;
    }

    var info = stats.toJson();

    if (stats.hasErrors()) {
      console.error(colors.red(info.errors));
    }

    if (stats.hasWarnings()) {
      console.warn(colors.yellow(info.warnings));
    }

    console.log(colors.yellow('Time: ' + info.time));
    logAssets(info.assets);

    done();
  });
};

module.exports = {
  affected: affected,
  bootstrap: bootstrap,
  compile: compile
};
