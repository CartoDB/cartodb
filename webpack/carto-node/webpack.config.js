// NOTE: this configuration file MUST NOT be loaded with `-p` or `--optimize-minimize` option.
// This option includes an implicit call to UglifyJsPlugin and LoaderOptionsPlugin. Instead,
// an explicit call is made in this file to these plugins with customized options that enables
// more control of the output bundle in order to fix unexpected behavior in old browsers.

const webpack = require('webpack');
const UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
const path = require('path');
const env = require('yargs').argv.env;

const libraryName = 'CartoNode';
const fileName = 'carto-node';

const uglifySettings = {
  test: /\.js$/,
  sourceMap: true,
  beautify: false,
  mangle: {
    screw_ie8: true,
    keep_fnames: true
  },
  compress: {
    screw_ie8: true
  },
  comments: false,
  output: {
    ascii_only: true
  },
  uglifyOptions: {
    compress: true
  }
};

let plugins = [];

const outputFile = env !== 'build'
  ? fileName + '.js'
  : (plugins.push(new UglifyJsPlugin(uglifySettings)),
    fileName + '.min.js');

const config = {
  entry: './lib/assets/javascripts/carto-node/index',

  output: {
    path: path.resolve(__dirname, '../../vendor/assets/javascripts/carto-node'),
    filename: outputFile,
    library: libraryName,
    libraryTarget: 'umd'
  },

  devtool: 'source-map',

  module: {
    rules: [{
      test: /\.js$/,
      loader: 'babel-loader',
      include: [
        path.resolve(__dirname, '../../lib/assets/javascripts/carto-node')
      ],
      options: {
        presets: ['env'],
        plugins: ['transform-object-assign']
      }
    }]
  },

  plugins: plugins
};

module.exports = config;
