const webpack = require("webpack");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require("path");

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
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  }
};
