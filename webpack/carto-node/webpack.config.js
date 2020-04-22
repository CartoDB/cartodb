// NOTE: this configuration file MUST NOT be loaded with `-p` or `--optimize-minimize` option.
// This option includes an implicit call to UglifyJsPlugin and LoaderOptionsPlugin. Instead,
// an explicit call is made in this file to these plugins with customized options that enables
// more control of the output bundle in order to fix unexpected behavior in old browsers.

const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const path = require('path');
const env = require('yargs').argv.env;

const libraryName = 'CartoNode';
const fileName = 'carto-node';

const outputFile = env !== 'build'
  ? fileName + '.js'
  : fileName + '.min.js';

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
        babelrc: true
      }
    }]
  },

  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        cache: false,
        parallel: true,
        uglifyOptions: {
          sourceMap: true,
          keep_fnames: true,
          output: {
            ascii_only: true,
            beautify: false
          }
        }
      })
    ]
  }
};

module.exports = config;
