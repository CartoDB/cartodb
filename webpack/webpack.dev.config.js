const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpackFiles = require('../lib/build/files/webpack_files');
const Package = require('./../package.json');

const VERSION = Package.version;
const MODULES_EXTENSION_REGEX = /\.js.babel$/;

module.exports = {
  entry: './lib/assets/javascripts/cartodb/static.js',
  output: {
    filename: `${VERSION}/javascripts/[name].js`,
    path: path.resolve(__dirname, '../public/assets'),
    publicPath: '/assets/'
  },
  devtool: 'source-map',
  plugins: Object.keys(webpackFiles).map((entryName) => {
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
        test: MODULES_EXTENSION_REGEX,
        loader: 'babel-loader',
        include: [
          path.resolve(__dirname, '../lib/assets/javascripts/carto-node')
        ],
        options: {
          presets: ['es2015'],
          plugins: ['transform-object-assign']
        }
      }
    ]
  }
};
