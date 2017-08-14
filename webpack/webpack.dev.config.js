const webpack = require("webpack");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require("path");

const PACKAGE = require('./../package.json');
const version = PACKAGE.version;

const entryPoints = {
  dashboard_static: [
    // './tmp/assets/javascripts/cdb_static.js',
    // './tmp/assets/javascripts/models_static.js',
    // './tmp/assets/javascripts/dashboard_deps_static.js',
    '../lib/assets/javascripts/cartodb/dashboard/static.js'
  ]
};

module.exports = {
  entry: entryPoints,
  output: {
    filename: `${version}/javascripts/[name].js`,
    path: path.resolve(__dirname, '../public/assets'),
    publicPath: '/assets/'
  },
  devtool: 'cheap-module-source-map',
  resolve: {
    alias: {
      'jst': path.resolve(__dirname, '../tmp/assets/javascripts/dashboard_templates_static.js')
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'shim-loader',
        include: [path.resolve(__dirname, '../tmp/assets/javascripts')],
        query: {
          shim: {
            [path.resolve(__dirname, '../tmp/assets/javascripts/cdb_static.js')]: {
              exports: 'cdb',
              deps: [
                'underscore:_',
                'jst'
              ]
            },
            [path.resolve(__dirname, '../tmp/assets/javascripts/dashboard_templates_static.js')]: {
              exports: 'jst'
            }
          }
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: path.resolve(__dirname, '../public/static/dashboard/index.html'),
      template: path.resolve(__dirname, '../lib/assets/javascripts/cartodb/dashboard/views/index.jst.ejs'),
      version: version
    })
  ]
};
