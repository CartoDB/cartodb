const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

const PACKAGE = require('./../package.json');
const version = PACKAGE.version;

const entryPoints = {
  static: [
    './lib/assets/javascripts/cartodb/static.js'
  ]
};

module.exports = {
  entry: entryPoints,
  output: {
    filename: `${version}/javascripts/[name].js`,
    path: path.resolve(__dirname, '../public/assets'),
    publicPath: '/assets/'
  },
  devtool: 'source-map',
  plugins: [
    new HtmlWebpackPlugin({
      inject: false,
      cache: false,
      filename: path.resolve(__dirname, '../public/static/dashboard/index.html'),
      template: path.resolve(__dirname, '../lib/assets/javascripts/cartodb/dashboard/views/index.jst.ejs')
    })
  ],
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  }
};
