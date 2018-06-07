// NOTE: this configuration file MUST NOT be loaded with `-p` or `--optimize-minimize` option.
// This option includes an implicit call to UglifyJsPlugin and LoaderOptionsPlugin. Instead,
// an explicit call is made in this file to these plugins with customized options that enables
// more control of the output bundle in order to fix unexpected behavior in old browsers.

const webpack = require('webpack');
const { resolve } = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WebpackDeleteAfterEmit = require('webpack-delete-after-emit');
const { version } = require('../../package.json');
const entryPoints = require('./entryPoints');
const { http_path_prefix } = require(`../../config/grunt_${process.env.NODE_ENV}.json`);

const rootDir = file => resolve(__dirname, '../../', file);
const isVendor = (module, count) => {
  const userRequest = module.userRequest;
  return userRequest && userRequest.indexOf('node_modules') >= 0;
};

module.exports = env => {
  return {
    entry: entryPoints,
    output: {
      filename: `${version}/javascripts/[name].js`,
      path: rootDir('public/assets')
    },
    resolve: {
      symlinks: false,
      modules: require('../common/modules.js'),
      alias: require('../common/alias.js')
    },
    devtool: 'source-map',
    plugins: Object.keys(entryPoints)
      .map(entry => new webpack.optimize.CommonsChunkPlugin({
        name: `${entry}_vendor`,
        chunks: [entry],
        minChunks: isVendor
      }))
      .concat([
        new webpack.LoaderOptionsPlugin({
          minimize: true
        }),

        // Extract common chuncks from the 3 vendor files
        new webpack.optimize.CommonsChunkPlugin({
          name: 'common_dashboard',
          chunks: Object.keys(entryPoints).map(n => `${n}_vendor`),
          minChunks: (module, count) => {
            return count >= Object.keys(entryPoints).length && isVendor(module);
          }
        }),

        // Extract common chuncks from the 3 entry points
        new webpack.optimize.CommonsChunkPlugin({
          children: true,
          minChunks: Object.keys(entryPoints).length
        }),

        new webpack.ProvidePlugin({
          $: 'jquery',
          jQuery: 'jquery',
          'window.jQuery': 'jquery'
        }),

        new webpack.DefinePlugin({
          __IN_DEV__: JSON.stringify(false),
          __ENV__: JSON.stringify('prod')
        }),

        new ExtractTextPlugin({
          filename: `./${version}/stylesheets/[name].css`
        }),

        new CopyWebpackPlugin([
          {
            from: rootDir('app/assets/images'),
            to: `./${version}/images/`,
            toType: 'dir'
          }
        ]),

        new WebpackDeleteAfterEmit({
          globs: [
            `${version}/javascripts/common_new.js`,
            `${version}/javascripts/common_new.js.map`,
            `${version}/javascripts/deep_insights_new.js`,
            `${version}/javascripts/deep_insights_new.js.map`,
            `${version}/javascripts/public_map_new.js`,
            `${version}/javascripts/public_map_new.js.map`
          ]
        }),

        // Minify
        new webpack.optimize.UglifyJsPlugin({
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
          }
        })
      ]),
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'shim-loader',
          include: [
            resolve(__dirname, '../../', 'node_modules/internal-carto.js')
          ],
          options: {
            shim: {
              'wax.cartodb.js': {
                exports: 'wax'
              },
              'html-css-sanitizer': {
                exports: 'html'
              },
              'lzma': {
                exports: 'LZMA'
              }
            }
          }
        },
        {
          test: /\.tpl$/,
          use: 'tpl-loader',
          include: [
            resolve(__dirname, '../../', 'lib/assets/javascripts/builder'),
            resolve(__dirname, '../../', 'lib/assets/javascripts/dashboard'),
            resolve(__dirname, '../../', 'node_modules/internal-carto.js')
          ]
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          include: [
            resolve(__dirname, '../../', 'node_modules/tangram-cartocss'),
            resolve(__dirname, '../../', 'node_modules/tangram.cartodb'),
            resolve(__dirname, '../../', 'lib/assets/javascripts/carto-node'),
            resolve(__dirname, '../../', 'lib/assets/javascripts/dashboard')
          ],
          options: {
            presets: ['env'],
            plugins: ['transform-object-rest-spread']
          }
        },
        {
          test: /\.s?css$/,
          use: ExtractTextPlugin.extract({
            use: [
              {
                loader: 'css-loader',
                options: {
                  alias: {
                    // This is because of Carto.js _leaflet partial
                    '../../img': '../img'
                  },
                  sourceMap: false
                }
              },
              {
                loader: 'sass-loader',
                options: {
                  data: `$assetsDir: "${http_path_prefix}/assets/${version}";`,
                  sourceMap: false,
                  includePaths: [
                    rootDir('node_modules/cartoassets/src/scss')
                  ]
                }
              }
            ]
          })
        },
        {
          test: /\.(ttf|eot|woff|woff2|svg)(.+#.+)?$/,
          use: {
            loader: 'file-loader',
            options: {
              name: `[name].[ext]`,
              outputPath: `${version}/fonts/`,
              publicPath: `${http_path_prefix}/assets/${version}/fonts/`
            }
          }
        },
        {
          test: /\.(png|gif)$/,
          use: {
            loader: 'file-loader',
            options: {
              name: `[name].[ext]`,
              outputPath: `${version}/images/`,
              publicPath: `${http_path_prefix}/assets/${version}/fonts/`
            }
          }
        }
      ]
    },

    node: {
      fs: 'empty' // This fixes the error Module not found: Error: Can't resolve 'fs'
    },

    stats: {
      warnings: false
    }
  };
};
