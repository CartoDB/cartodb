// NOTE: this configuration file MUST NOT be loaded with `-p` or `--optimize-minimize` option.
// This option includes an implicit call to UglifyJsPlugin and LoaderOptionsPlugin. Instead,
// an explicit call is made in this file to these plugins with customized options that enables
// more control of the output bundle in order to fix unexpected behavior in old browsers.
const webpack = require('webpack');
const merge = require('webpack-merge');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const baseConfig = require('./webpack.base.config.js');

module.exports = merge(baseConfig, {
  mode: 'production',
  plugins: [
    new webpack.DefinePlugin({
      __IN_DEV__: JSON.stringify(false),
      __ENV__: JSON.stringify('prod'),
      __KEPLERGL_BASE_URL__: JSON.stringify('https://kepler.gl')
    })
  ],
  optimization: {
    sideEffects: false,
    minimizer: [
      new UglifyJsPlugin({
        cache: false,
        parallel: true,
        sourceMap: true,
        uglifyOptions: {
          keep_fnames: true,
          output: {
            ascii_only: true,
            beautify: false
          }
        }
      }),
      new OptimizeCSSAssetsPlugin({
        cssProcessorOptions: {
          zindex: false,
          reduceIdents: false,
          autoprefixer: {
            remove: false,
            add: true,
            browsers: ['> 1%']
          }
        }
      })
    ]
  }
});
