const webpack = require('webpack');
const {resolve} = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const PACKAGE = require('./package.json');
const version = PACKAGE.version;

const isProduction = process.env.NODE_ENV === 'production';

const isVendor = (module, count) => {
  const userRequest = module.userRequest;
  return userRequest && userRequest.indexOf('node_modules') >= 0;
};

const entryPoints = {
  public_editor: './lib/assets/core/javascripts/cartodb3/public_editor.js',
  dataset: './lib/assets/core/javascripts/cartodb3/dataset.js',
  editor: './lib/assets/core/javascripts/cartodb3/editor.js'
};

module.exports = env => {
  return {
    entry: entryPoints,
    output: {
      filename: `${version}/[name].js`,
      path: resolve(__dirname, 'dist')
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    plugins: [
      isProduction ? undefined : new BundleAnalyzerPlugin({
        analyzerMode: 'static'
      })
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
      new webpack.optimize.CommonsChunkPlugin({
        name: 'common',
        chunks: Object.keys(entryPoints).map(n => `${n}_vendor`),
        minChunks: (module, count) => {
          return count >= Object.keys(entryPoints).length && isVendor(module);
        }
      })
    ])
    .concat(
        // Extract common chuncks in the 3 entries
        new webpack.optimize.CommonsChunkPlugin({
          children: true,
          minChunks: Object.keys(entryPoints).length
        })
      )
    .concat(
      isProduction ? new webpack.optimize.UglifyJsPlugin({
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
      }) : undefined
    )
    .filter(p => !!p), // undefined is not a valid plugin, so filter undefined values here
    module: {
      rules: [
        {
          test: /\.tpl$/,
          use: 'tpl-loader'
        },
        {
          test: /\.mustache$/,
          use: 'raw-loader'
        }
      ]
    },

    node: {
      fs: 'empty' // This fixes the error Module not found: Error: Can't resolve 'fs'
    }
  };
};
