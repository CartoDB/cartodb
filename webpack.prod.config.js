const webpack = require('webpack');
const {resolve} = require('path');
const PACKAGE = require('./package.json');
const version = PACKAGE.version;

const isVendor = (module, count) => {
  const userRequest = module.userRequest;
  return userRequest && userRequest.indexOf('node_modules') >= 0;
};

const entryPoints = {
  builder_embed: './lib/assets/core/javascripts/cartodb3/public_editor.js',
  dataset: './lib/assets/core/javascripts/cartodb3/dataset.js',
  builder: './lib/assets/core/javascripts/cartodb3/editor.js'
};

module.exports = env => {
  return {
    entry: entryPoints,
    output: {
      filename: `${version}/javascripts/[name].js`,
      path: resolve(__dirname, 'public/assets')
    },
    devtool: 'source-map',
    plugins: Object.keys(entryPoints)
        .map(entry => new webpack.optimize.CommonsChunkPlugin({
          name: `${entry}_vendor`,
          chunks: [entry],
          minChunks: isVendor
        }))
    .concat([
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
        ['window.jQuery']: 'jquery'
      }),

      new webpack.DefinePlugin({
        __IN_DEV__: JSON.stringify(false)
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
        comments: false
      })
    ]),
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'shim-loader',
          include: [
            resolve(__dirname, 'node_modules/cartodb.js')
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
            resolve(__dirname, 'lib/assets/core/javascripts/cartodb3'),
            resolve(__dirname, 'node_modules/cartodb.js'),
            resolve(__dirname, 'node_modules/cartodb-deep-insights.js')
          ]
        },
        {
          test: /\.mustache$/,
          use: 'raw-loader',
          include: [
            resolve(__dirname, 'lib/assets/core/javascripts/cartodb3'),
            resolve(__dirname, 'node_modules/cartodb.js'),
            resolve(__dirname, 'node_modules/cartodb-deep-insights.js')
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
