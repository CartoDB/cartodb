var webpackConfig = require('./webpack.dev.config.js');
module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    files: ['.grunt/main.affected-specs.js'],
    reporters: ['progress'],
    port: 9876,  // karma web server port
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['ChromeHeadless'],
    autoWatch: false,
    // singleRun: false, // Karma captures browsers, runs the tests and exits
    concurrency: Infinity,
    webpack: webpackConfig,

  })
}
