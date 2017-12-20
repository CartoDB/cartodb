const path = require('path');
const webpack = require('webpack');
const banner = require('./banner');

module.exports = {
  entry: './src/api/v4/index.js',
  output: {
    path: path.resolve(__dirname, '../dist/public'),
    filename: 'carto.js',
    library: 'carto',
    libraryTarget: 'umd'
  },
  plugins: [
    // Include only the lastest camshaft-reference
    new webpack.IgnorePlugin(/^\.\/((?!0\.59\.4).)*\/reference\.json$/),
    new webpack.BannerPlugin(banner)
  ]
};
