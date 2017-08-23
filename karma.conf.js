module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine-ajax', 'jasmine'],
    files: [
      '.grunt/main.affected-specs.js'
    ],
    reporters: ['dots'],
    autoWatch: false,
    port: 9876,
    colors: true,
    logLevel: config.ERROR,
    browsers: ['ChromeHeadless'],
    concurrency: Infinity,
    captureTimeout: 60000,
    browserNoActivityTimeout: 100000
  });
};
