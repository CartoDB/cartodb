const path = require('path');
const webpack = require('webpack');

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine-ajax', 'jasmine'],
    files: [
      'lib/assets/test/spec/cartodb3/loadtests.js'
    ],
    preprocessors: {
      'lib/assets/test/spec/cartodb3/loadtests.js': ['webpack']
    },
    webpack: {
      entry: () => {
        return {};
      }, // For webpack 2.2.0 and beyond, config schema is strictly enforced and will error if it's missing something required.
      devtool: 'cheap-module-source-map',
      plugins: [
        new webpack.ProvidePlugin({
          $: 'jquery',
          jQuery: 'jquery',
          ['window.jQuery']: 'jquery'
        })
      ],
      module: {
        rules: [{
          test: /\.js$/,
          loader: 'shim-loader',
          query: {
            shim: {
              'wax.cartodb.js': {
                exports: 'wax'
              },
              'html-css-sanitizer': {
                exports: 'html'
              }
            }
          }
        }, {
          test: /\.js$/,
          loader: 'babel-loader',
          include: [path.resolve(path.resolve('.'), 'node_modules/tangram.cartodb')],
          options: {
            presets: [
              ['es2015', {
                'modules': false
              }]
            ]
          }
        }, {
          test: /\.tpl$/,
          use: 'tpl-loader'
        }, {
          test: /\.mustache$/,
          use: 'raw-loader'
        }],
        exprContextRegExp: /$^/,
        exprContextCritical: false
      },
      node: {
        fs: 'empty' // This fixes the error Module not found: Error: Can't resolve 'fs'
      },
      stats: 'none',
      performance: {
        hints: false
      }
    },
    webpackMiddleware: {
      stats: {
        assets: false,
        children: false,
        chunks: false,
        chunkModules: false,
        chunkOrigins: false,
        colors: true,
        entrypoints: false,
        errors: true,
        errorDetails: true,
        hash: false,
        modules: false,
        performance: false,
        timings: false,
        usedExports: false,
        version: false,
        warnings: false
      }
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_ERROR,
    browsers: ['ChromeHeadless'],
    concurrency: Infinity,
    captureTimeout: 60000,
    browserNoActivityTimeout: 100000
  });
};
