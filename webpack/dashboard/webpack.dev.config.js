const webpack = require('webpack');
const {resolve} = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const PACKAGE = require('../../package.json');
const version = PACKAGE.version;

const stats = (env) => {
  return env && env.stats;
};

const isVendor = (module, count) => {
  const userRequest = module.userRequest;
  return userRequest && userRequest.indexOf('node_modules') >= 0;
};

const entryPoints = {
  user_feed_new: resolve(__dirname, '../../', 'lib/assets/javascripts/dashboard/user-feed.js')
};

module.exports = env => {
  return {
    entry: entryPoints,
    output: {
      filename: `${version}/javascripts/[name].js`,
      path: resolve(__dirname, '../../', 'public/assets')
    },
    resolve: {
      symlinks: false,
      modules: require('../common/modules.js'),
      alias: require('../common/alias.js')
    },
    devtool: 'source-map',
    plugins: [
      stats(env) ? new BundleAnalyzerPlugin({
        analyzerMode: 'static'
      }) : undefined
    ].concat(
      // For each entry point, we generate the vendor file
      Object.keys(entryPoints)
        .map(entry => new webpack.optimize.CommonsChunkPlugin({
          name: `${entry}_vendor`,
          chunks: [entry],
          minChunks: isVendor
        }))
    )
      .concat([
      // Extract common chuncks from the 3 vendor files
        new webpack.optimize.CommonsChunkPlugin({
          name: 'common_dashboard',
          chunks: Object.keys(entryPoints).map(n => `${n}_vendor`),
          minChunks: (module, count) => {
            return count >= Object.keys(entryPoints).length && isVendor(module);
          }
        }),

        // Extract common chuncks from the 3 entry points
        new webpack.optimize.CommonsChunkPlugin({
          children: true,
          minChunks: Object.keys(entryPoints).length
        }),

        new webpack.ProvidePlugin({
          $: 'jquery',
          jQuery: 'jquery',
          'window.jQuery': 'jquery'
        }),

        new webpack.DefinePlugin({
          __IN_DEV__: JSON.stringify(true),
          __ENV__: JSON.stringify('dev')
        })
      ])
      .filter(p => !!p), // undefined is not a valid plugin, so filter undefined values here
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'shim-loader',
          include: [
            resolve(__dirname, '../../', 'node_modules/cartodb.js')
          ],
          options: {
            shim: {
              'wax.cartodb.js': {
                exports: 'wax'
              },
              'html-css-sanitizer': {
                exports: 'html'
              },
              'lzma': {
                exports: 'LZMA'
              }
            }
          }
        },
        {
          test: /\.tpl$/,
          use: 'tpl-loader',
          include: [
            resolve(__dirname, '../../', 'lib/assets/javascripts/builder'),
            resolve(__dirname, '../../', 'lib/assets/javascripts/dashboard'),
            resolve(__dirname, '../../', 'node_modules/cartodb.js')
          ]
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          include: [
            resolve(__dirname, '../../', 'node_modules/tangram-cartocss'),
            resolve(__dirname, '../../', 'node_modules/tangram.cartodb'),
            resolve(__dirname, '../../', 'lib/assets/javascripts/dashboard')
          ],
          options: {
            presets: ['env']
          }
        }
      ]
    },

    node: {
      fs: 'empty' // This fixes the error Module not found: Error: Can't resolve 'fs'
    },

    stats: 'normal'
  };
};
