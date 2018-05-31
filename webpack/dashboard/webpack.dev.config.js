const webpack = require('webpack');
const glob = require('glob');
const { resolve } = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const { version } = require('../../package.json');

const PATHS_TO_CLEAN = [
  'common.js'
];

const stats = (env) => {
  return env && env.stats;
};

const rootDir = file => resolve(__dirname, '../../', file);

const isVendor = (module, count) => {
  const userRequest = module.userRequest;
  return userRequest && userRequest.indexOf('node_modules') >= 0;
};

const entryPoints = {
  common: [
    rootDir('app/assets/stylesheets/old_common/video_player.scss'),
    rootDir('app/assets/stylesheets/cartoassets/entry.scss'),
    ...glob.sync(rootDir('app/assets/stylesheets/common/**/*.scss')),
    ...glob.sync(rootDir('app/assets/stylesheets/client/**/*.scss'))
  ],
  public_table_new: rootDir('lib/assets/javascripts/dashboard/public-dataset.js'),
  public_dashboard_new: rootDir('lib/assets/javascripts/dashboard/public-dashboard.js'),
  user_feed_new: rootDir('lib/assets/javascripts/dashboard/user-feed.js'),
  api_keys_new: [
    rootDir('lib/assets/javascripts/dashboard/api-keys.js'),
    rootDir('app/assets/stylesheets/new_dashboard/api-keys.scss'),
    rootDir('app/assets/stylesheets/plugins/tipsy.scss')
  ],
  data_library_new: rootDir('lib/assets/javascripts/dashboard/data-library.js'),
  mobile_apps_new: rootDir('lib/assets/javascripts/dashboard/mobile-apps.js'),
  account_new: rootDir('lib/assets/javascripts/dashboard/account.js'),
  profile_new: rootDir('lib/assets/javascripts/dashboard/profile.js'),
  sessions_new: rootDir('lib/assets/javascripts/dashboard/sessions.js'),
  confirmation_new: rootDir('lib/assets/javascripts/dashboard/confirmation.js'),
  dashboard_new: rootDir('lib/assets/javascripts/dashboard/dashboard.js'),
  organization_new: rootDir('lib/assets/javascripts/dashboard/organization.js')
};

module.exports = env => {
  return {
    entry: entryPoints,
    output: {
      filename: `${version}/javascripts/[name].js`,
      path: rootDir('public/assets')
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
        }),

        new ExtractTextPlugin({
          filename: `./${version}/stylesheets/[name].css`
        }),

        new CleanWebpackPlugin(PATHS_TO_CLEAN, {
          root: rootDir(`public/assets/${version}/javascripts`),
          verbose: true
        })
      ])
      .filter(p => !!p), // undefined is not a valid plugin, so filter undefined values here
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
        },
        {
          test: /\.scss$/,
          use: ExtractTextPlugin.extract({
            use: ['css-loader', 'sass-loader']
          })
        }
      ]
    },

    node: {
      fs: 'empty' // This fixes the error Module not found: Error: Can't resolve 'fs'
    },

    stats: 'normal'
  };
};
