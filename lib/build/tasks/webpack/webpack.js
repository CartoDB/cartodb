var webpack = require('webpack');
var _ = require('underscore');
var colors = require('colors');
var pretty = require('prettysize');
var glob = require('glob');
var StatsWriterPlugin = require('webpack-stats-plugin').StatsWriterPlugin;
var configGenerator = require('./webpack.config.js').task;

var compiler = {};
var affectedSpecs = [];
var cache = {};
var paths = {
  builder_specs: './lib/assets/test/spec/builder/**/*.spec.js',
  dashboard_specs: './lib/assets/test/spec/dashboard/**/*.spec.js',
  deep_insights_specs: './lib/assets/test/spec/deep-insights/**/*.spec.js'
};

// Filter a list of files with a string
// the string will be converted to a RegExp
function filterSpecs (affectedSpecs, match) {
  const re = new RegExp(match);
  return affectedSpecs.filter(specFile => {
    const fileName = specFile.split(/spec\//)[1];
    return re.test(fileName);
  });
}

/**
 * affected - To be used as part of a 'registerTask' Grunt definition
 */
var affected = function (option, grunt) {
  var done = this.async();

  affectedSpecs = [
    './lib/build/source-map-support.js',
    './lib/assets/javascripts/builder/components/form-components/index.js',
    './lib/assets/test/spec/builder/components/modals/add-analysis/analysis-options.spec.js',
    './lib/assets/test/spec/builder/routes/router.spec.js'
  ];

  let allSpecs = glob.sync(paths.builder_specs).concat(glob.sync(paths.deep_insights_specs));
  const match = grunt.option('match');

  if (match) {
    allSpecs = filterSpecs(allSpecs, match);
  }

  console.log(colors.yellow('All specs. ' + allSpecs.length + ' specs found.'));

  affectedSpecs = affectedSpecs.concat(allSpecs);

  done();
};

/**
 * dashboard - To be used as part of a 'registerTask' Grunt definition
 */
var dashboard = function (option, grunt) {
  affectedSpecs = glob.sync(paths.dashboard_specs);
  const match = grunt.option('match');

  if (match) {
    affectedSpecs = filterSpecs(affectedSpecs, match);
  }

  console.log(colors.yellow('All specs. ' + affectedSpecs.length + ' specs found.'));
};

var bootstrap = function (config, grunt) {
  if (!config) {
    throw new Error('Please provide subconfiguration key for webpack.');
  }

  const cfg = configGenerator(config);

  cfg.entry = function () {
    return affectedSpecs;
  };

  compiler[config] = webpack(cfg);
  cache[config] = {};
  compiler[config].apply(new webpack.CachePlugin(cache[config]));

  // Flag stats === true -> write stats.json
  if (grunt.option('stats')) {
    compiler[config].apply(new StatsWriterPlugin({
      transform: function (data, opts) {
        var stats = opts.compiler.getStats().toJson({chunkModules: true});
        return JSON.stringify(stats, null, 2);
      }
    }));
  }
};

function logAssets (assets) {
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
      console.error('');
      console.error('🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥');
      console.error(colors.red('THERE WAS AN ERROR WHILE BUNDLING!!!'));
      console.error('🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥');
    }
    if (!stats.hasErrors()) {
      logAssets(info.assets);
      console.log(colors.yellow('Time: ' + info.time));
    }
    done();
  });
};

module.exports = {
  affected: affected,
  dashboard: dashboard,
  bootstrap: bootstrap,
  compile: compile
};
