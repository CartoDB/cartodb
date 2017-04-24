const webpack = require('webpack');
const {resolve} = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const PACKAGE = require('./package.json');
const version = PACKAGE.version;

const isProduction = process.env.NODE_ENV === 'production';

const internalDepsFilter = (module, count) => {
  return module.resource && /cartodb.js|deep-insights.js/.test(module.resource);
};

module.exports = env => {
  return {
    entry: {
      public_editor: './lib/assets/core/javascripts/cartodb3/public_editor.js',
      dataset: './lib/assets/core/javascripts/cartodb3/dataset.js',
      editor: './lib/assets/core/javascripts/cartodb3/editor.js'
    },
    output: {
      filename: `${version}/[name].[chunkhash].js`,
      path: resolve(__dirname, 'dist')
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    plugins: [
      isProduction ? undefined : new BundleAnalyzerPlugin({
        analyzerMode: 'static'
      }),

      new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor',
        minChunks: function (module) {
          // this assumes your vendor imports exist in the node_modules directory
          return module.context && module.context.indexOf('node_modules') !== -1;
        }
      }),

      new webpack.optimize.CommonsChunkPlugin({
        name: 'common',
        minChunks: internalDepsFilter
      })
    ].filter(p => !!p), // undefined is not a valid plugin, so filter undefined values here
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
