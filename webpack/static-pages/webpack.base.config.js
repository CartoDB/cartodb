const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');
const webpackFiles = require('../../lib/build/files/webpack_files');
const Package = require('./../../package.json');

const VERSION = Package.version;
const PUBLIC_STATICS_CONFIG = require('../../config/public_statics_config');

console.log(`CARTO_BUILDER_ASSET_HOST is: ${PUBLIC_STATICS_CONFIG.CARTO_BUILDER_ASSET_HOST}`);
console.log(`CARTO_MAPS_API_V2_EXTERNAL_URL is: ${PUBLIC_STATICS_CONFIG.CARTO_MAPS_API_V2_EXTERNAL_URL}`);

module.exports = {
  entry: Object.assign(
    { main: './lib/assets/javascripts/dashboard/statics/static.js' },
    webpackFiles.gearEntryPoints
  ),
  output: {
    filename: `${VERSION}/javascripts/[name].js`,
    path: path.resolve(__dirname, '../../public/assets'),
    publicPath: '/assets/'
  },
  devtool: 'source-map',
  resolve: {
    symlinks: true
  },
  plugins: [
    new webpack.DefinePlugin({
      __ASSETS_VERSION__: `'${VERSION}'`,
      __CARTO_BUILDER_ASSET_HOST__: PUBLIC_STATICS_CONFIG.CARTO_BUILDER_ASSET_HOST,
      __CARTO_MAPS_API_V2_EXTERNAL_URL__: PUBLIC_STATICS_CONFIG.CARTO_MAPS_API_V2_EXTERNAL_URL
    }),

    ...Object.keys(webpackFiles.htmlFiles).map((entryName) => {
      return new HtmlWebpackPlugin({
        inject: false,
        cache: false,
        filename: webpackFiles.htmlFiles[entryName].filename || path.resolve(__dirname, `../../public/static/${entryName}/index.html`),
        template: path.resolve(__dirname, '../../lib/assets/javascripts/dashboard/statics/index.jst.ejs'),
        config: webpackFiles.htmlFiles[entryName]
      });
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [
          './node_modules/@carto/viewer'
        ],
        exclude: [
          './node_modules/@carto/viewer/node_modules'
        ],
        options: {
          babelrc: true
        }
      },
      {
        test: /\.svg$/,
        use: ['@svgr/webpack'],
        include: [
          './node_modules/@carto/viewer'
        ],
        exclude: [
          './node_modules/@carto/viewer/node_modules'
        ]
      }
    ]
  }
};
