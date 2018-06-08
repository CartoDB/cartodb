// NOTE: this configuration file MUST NOT be loaded with `-p` or `--optimize-minimize` option.
// This option includes an implicit call to UglifyJsPlugin and LoaderOptionsPlugin. Instead,
// an explicit call is made in this file to these plugins with customized options that enables
// more control of the output bundle in order to fix unexpected behavior in old browsers.

const webpack = require('webpack');
const {resolve} = require('path');
const PACKAGE = require('../../package.json');
const version = PACKAGE.version;

const isVendor = (module, count) => {
  const userRequest = module.userRequest;
  return userRequest && userRequest.indexOf('node_modules') >= 0;
};

const entryPoints = {
  public_table_new: resolve(__dirname, '../../', 'lib/assets/javascripts/dashboard/public-dataset.js'),
  public_dashboard_new: resolve(__dirname, '../../', 'lib/assets/javascripts/dashboard/public-dashboard.js'),
  user_feed_new: resolve(__dirname, '../../', 'lib/assets/javascripts/dashboard/user-feed.js'),
  api_keys_new: resolve(__dirname, '../../', 'lib/assets/javascripts/dashboard/api-keys.js'),
  data_library_new: resolve(__dirname, '../../', 'lib/assets/javascripts/dashboard/data-library.js'),
  account_new: resolve(__dirname, '../../', 'lib/assets/javascripts/dashboard/account.js'),
  profile_new: resolve(__dirname, '../../', 'lib/assets/javascripts/dashboard/profile.js'),
  sessions_new: resolve(__dirname, '../../', 'lib/assets/javascripts/dashboard/sessions.js'),
  confirmation_new: resolve(__dirname, '../../', 'lib/assets/javascripts/dashboard/confirmation.js'),
  mobile_apps_new: resolve(__dirname, '../../', 'lib/assets/javascripts/dashboard/mobile-apps.js'),
  dashboard_new: resolve(__dirname, '../../', 'lib/assets/javascripts/dashboard/dashboard.js'),
  organization_new: resolve(__dirname, '../../', 'lib/assets/javascripts/dashboard/organization.js')
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
    plugins: Object.keys(entryPoints)
      .map(entry => new webpack.optimize.CommonsChunkPlugin({
        name: `${entry}_vendor`,
        chunks: [entry],
        minChunks: isVendor
      }))
      .concat([
        new webpack.LoaderOptionsPlugin({
          minimize: true
        }),

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
          __IN_DEV__: JSON.stringify(false),
          __ENV__: JSON.stringify('prod')
        }),

        // Minify
        new webpack.optimize.UglifyJsPlugin({
          sourceMap: true,
          beautify: false,
          mangle: {
            screw_ie8: true,
            keep_fnames: true
          },
          compress: {
            screw_ie8: true
          },
          comments: false,
          output: {
            ascii_only: true
          }
        })
      ]),
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'shim-loader',
          include: [
            resolve(__dirname, '../../', 'node_modules/internal-carto.js')
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
            resolve(__dirname, '../../', 'node_modules/internal-carto.js')
          ]
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          include: [
            resolve(__dirname, '../../', 'node_modules/tangram-cartocss'),
            resolve(__dirname, '../../', 'node_modules/tangram.cartodb'),
            resolve(__dirname, '../../', 'lib/assets/javascripts/carto-node'),
            resolve(__dirname, '../../', 'lib/assets/javascripts/dashboard')
          ],
          options: {
            presets: ['env'],
            plugins: ['transform-object-rest-spread']
          }
        }
      ]
    },

    node: {
      fs: 'empty' // This fixes the error Module not found: Error: Can't resolve 'fs'
    },

    stats: {
      warnings: false
    }
  };
};
