const webpack = require("webpack");
const path = require("path");
const PACKAGE = require('./../package.json');
const version = PACKAGE.version;

const entryPoints = {
  dashboard_static: [
    './tmp/assets/javascripts/cdb_static.js',
    './tmp/assets/javascripts/models_static.js',
    './tmp/assets/javascripts/dashboard_deps_static.js',
    './tmp/assets/javascripts/dashboard_static.js'
  ]
};

module.exports = {
  entry: entryPoints,
  output: {
    filename: `${version}/javascripts/[name].js`,
    path: path.resolve(__dirname, '../public/assets')
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
  }
};
