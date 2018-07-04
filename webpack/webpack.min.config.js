const path = require('path');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const banner = require('./banner');

module.exports = {
  entry: './src/api/v4/index.js',
  output: {
    path: path.resolve(__dirname, '../dist/public'),
    filename: 'carto.min.js',
    library: 'carto',
    libraryTarget: 'umd'
  },
  plugins: [
    new webpack.DefinePlugin({
      __ENV__: JSON.stringify(process.env.NODE_ENV)
    }),
    // Include only the lastest camshaft-reference
    new webpack.IgnorePlugin(/^\.\/((?!0\.59\.4).)*\/reference\.json$/),
    new UglifyJsPlugin(),
    new webpack.BannerPlugin(banner)
  ]
};
