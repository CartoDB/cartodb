const webpack = require('webpack');
const merge = require('webpack-merge');
const configBase = require('./webpack.base.config.js');

module.exports = merge(configBase, {
  mode: 'development',
  plugins: [
    new webpack.DefinePlugin({
      __IN_DEV__: JSON.stringify(true),
      __ENV__: JSON.stringify('dev'),
      __KEPLERGL_BASE_URL__: JSON.stringify('http://localhost:8081')
    })
  ],
  optimization: {
    usedExports: true
  }
});
