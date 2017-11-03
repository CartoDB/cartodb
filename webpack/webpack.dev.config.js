const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpackFiles = require('../lib/build/files/webpack_files');

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
  plugins: Object.keys(webpackFiles).map(function (entryName) {
    return new HtmlWebpackPlugin({
      inject: false,
      cache: false,
      filename: path.resolve(__dirname, `../public/static/${entryName}/index.html`),
      template: path.resolve(__dirname, '../lib/assets/javascripts/cartodb/static/index.jst.ejs'),
      config: webpackFiles[entryName]
    });
  }),
  module: {
    rules: [
      {
        test: /\.js(\.babel)?$/,
        loader: 'babel-loader',
        include: [
          path.resolve(__dirname, '../lib/assets/core/javascripts/carto-node')
        ],
        options: {
          presets: ['es2015'],
          plugins: ['transform-object-assign']
        }
      }
    ]
  }
};
