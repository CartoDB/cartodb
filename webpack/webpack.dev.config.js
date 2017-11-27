const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpackFiles = require('../lib/build/files/webpack_files');
const Package = require('./../package.json');

const VERSION = Package.version;

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
  })
};
