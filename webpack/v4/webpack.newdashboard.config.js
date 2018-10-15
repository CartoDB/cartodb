const webpack = require('webpack');
const merge = require('webpack-merge');
const configBase = require('./webpack.base.config.js');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = merge(configBase, {
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      __IN_DEV__: JSON.stringify(true),
      __ENV__: JSON.stringify('dev')
    }),
    // make sure to include the plugin for the magic
    new VueLoaderPlugin()
  ]
});
