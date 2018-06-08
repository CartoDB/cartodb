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
  builder_embed: ['whatwg-fetch', resolve(__dirname, '../../', 'lib/assets/javascripts/builder/public_editor.js')],
  dataset: resolve(__dirname, '../../', 'lib/assets/javascripts/builder/dataset.js'),
  builder: resolve(__dirname, '../../', 'lib/assets/javascripts/builder/editor.js')
};

module.exports = env => {
  return {
    entry: entryPoints,
    output: {
      filename: `${version}/javascripts/[name].js`,
      path: resolve(__dirname, '../../', 'public/assets')
    },
    resolve: {
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
          name: 'common',
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
              'lzma': {
                exports: 'LZMA'
              },
              'html-css-sanitizer': {
                exports: 'html'
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
            resolve(__dirname, '../../', 'lib/assets/javascripts/deep-insights'),
            resolve(__dirname, '../../', 'node_modules/internal-carto.js')
          ]
        },
        {
          test: /\.mustache$/,
          use: 'raw-loader',
          include: [
            resolve(__dirname, '../../', 'lib/assets/javascripts/builder'),
            resolve(__dirname, '../../', 'lib/assets/javascripts/deep-insights'),
            resolve(__dirname, '../../', 'node_modules/internal-carto.js')
          ]
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
