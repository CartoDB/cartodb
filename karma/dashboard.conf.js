// Karma configuration for Dashboard

const webpack = require('webpack');
const webpackConfig = require('../lib/build/tasks/webpack/webpack.config.js').task('');
const excludedPlugins = [
  webpack.optimize.CommonsChunkPlugin
];

module.exports = function (config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '../',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine-ajax', 'jasmine'],

    // list of files / patterns to load in the browser
    files: [
      'node_modules/underscore/underscore-min.js',
      'lib/assets/test/spec/SpecHelper3.js',
      'lib/assets/test/spec/dashboard/index.spec.js'
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'lib/assets/test/spec/dashboard/index.spec.js': ['webpack']
    },

    webpack: Object.assign({},
      {
        resolve: webpackConfig.resolve,
        module: webpackConfig.module,
        plugins: webpackConfig.plugins.filter(
          plugin => !excludedPlugins.some(excludedPlugin => plugin instanceof excludedPlugin)
        ),
        target: webpackConfig.target,
        node: webpackConfig.node
      }
    ),

    // test results reporter to use
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'kjhtml'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  });
};
