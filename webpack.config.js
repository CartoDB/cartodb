const webpack = require('webpack');
const {resolve} = require('path');
const PACKAGE = require('./package.json');
const version = PACKAGE.version;

module.exports = env => {
  return {
    entry: {
      public_editor: './lib/assets/core/javascripts/cartodb3/public_editor.js',
      dataset: './lib/assets/core/javascripts/cartodb3/dataset.js',
      editor: './lib/assets/core/javascripts/cartodb3/editor.js'
    },
    output: {
      filename: `${version}/[name].js`,
      path: resolve(__dirname, 'dist')
    },
    plugins: [
      new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor',
        minChunks: function (module) {
          // this assumes your vendor imports exist in the node_modules directory
          return module.context && module.context.indexOf('node_modules') !== -1;
        }
      })
    ],
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
