const webpack = require('webpack');
const { resolve } = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WebpackDeleteAfterEmit = require('webpack-delete-after-emit');
const { version } = require('../../package.json');
const entryPoints = require('./entryPoints');

const stats = (env) => (env && env.stats);
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
    plugins: [
      stats(env) ? new BundleAnalyzerPlugin({
        analyzerMode: 'static'
      }) : undefined
    ].concat(
      // For each entry point, we generate the vendor file
      Object.keys(entryPoints)
        .map(entry => new webpack.optimize.CommonsChunkPlugin({
          name: `${entry}_vendor`,
          chunks: [entry],
          minChunks: isVendor
        }))
    )
      .concat([
      // Extract common chuncks from the 3 vendor files
        new webpack.optimize.CommonsChunkPlugin({
          name: 'common',
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
          __IN_DEV__: JSON.stringify(true),
          __ENV__: JSON.stringify('dev')
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
            `${version}/javascripts/common_editor3.js`,
            `${version}/javascripts/common_editor3.js.map`,
            `${version}/javascripts/editor3.js`,
            `${version}/javascripts/editor3.js.map`
          ]
        })
      ])
      .filter(p => !!p), // undefined is not a valid plugin, so filter undefined values here
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'shim-loader',
          include: [
            rootDir('node_modules/internal-carto.js')
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
            rootDir('lib/assets/javascripts/builder'),
            rootDir('lib/assets/javascripts/deep-insights'),
            rootDir('node_modules/internal-carto.js')
          ]
        },
        {
          test: /\.mustache$/,
          use: 'raw-loader',
          include: [
            rootDir('lib/assets/javascripts/builder'),
            rootDir('lib/assets/javascripts/deep-insights'),
            rootDir('node_modules/internal-carto.js')
          ]
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
                  data: `$assetsDir: "/assets/${version}";`,
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
              publicPath: `/assets/${version}/fonts/`
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
              publicPath: `/assets/${version}/images/`
            }
          }
        }
      ]
    },

    node: {
      fs: 'empty' // This fixes the error Module not found: Error: Can't resolve 'fs'
    },

    stats: 'normal'
  };
};
