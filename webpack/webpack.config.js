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
  devtool: 'sourcemap',
  plugins: [
    new webpack.DefinePlugin({
      __ENV__: JSON.stringify(process.env.NODE_ENV)
    }),
    // Include only the lastest camshaft-reference
    new webpack.IgnorePlugin(/^\.\/((?!0\.59\.4).)*\/reference\.json$/),
    new webpack.BannerPlugin(banner)
  ]
};
