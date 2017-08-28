const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
var webpack_files = require('../lib/build/files/webpack_files');

const PACKAGE = require('./../package.json');
const version = PACKAGE.version;

module.exports = {
  entry: './lib/assets/javascripts/cartodb/static.js',
  output: {
    filename: `${version}/javascripts/[name].js`,
    path: path.resolve(__dirname, '../public/assets'),
    publicPath: '/assets/'
  },
  devtool: 'source-map',
  plugins: Object.keys(webpack_files).map(function (entryName) {
    return new HtmlWebpackPlugin({
      inject: false,
      cache: false,
      filename: path.resolve(__dirname, '../public/static/' + entryName + '/index.html'),
      template: path.resolve(__dirname, '../lib/assets/javascripts/cartodb/static/index.jst.ejs'),
      config: webpack_files[entryName]
    });
  }),
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [
          path.resolve(__dirname, '../lib/assets/javascripts/carto-node')
        ],
        options: {
          presets: ['es2015']
        }
      }
    ]
  },
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  }
};
