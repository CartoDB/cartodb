const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WebpackDeleteAfterEmit = require('webpack-delete-after-emit');
const { version } = require('../../package.json');
const { http_path_prefix } = require(`../../config/grunt_${process.env.NODE_ENV}.json`);
const PUBLIC_STATICS_CONFIG = require('../../config/public_statics_config');
const entryPoints = require('./entryPoints');

const vueLoaderConfig = require('../new-dashboard/vue-loader.conf');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

const isVendor = name => name.indexOf('node_modules') >= 0;
const isJavascript = name => name.endsWith('.js');

const { rootDir, GearResolverPlugin } = require('./gearAwareResolver');

module.exports = {
  entry: entryPoints,
  output: {
    filename: `${version}/javascripts/[name].js`,
    path: rootDir('public/assets'),
    publicPath: http_path_prefix + '/assets/'
  },
  resolve: {
    extensions: ['.js', '.vue', '.json', '.scss'],
    symlinks: false,
    modules: require('../common/modules.js'),
    alias: require('../common/alias.js')
  },
  devtool: 'source-map',
  plugins: [
    new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /en/),

    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery'
    }),

    new webpack.DefinePlugin({
      __IN_DEV__: JSON.stringify(false),
      __ENV__: JSON.stringify('prod'),
      __ASSETS_VERSION__: JSON.stringify(version),
      __ASSETS_PATH__: JSON.stringify(`${http_path_prefix}/assets/${version}`),
      __KEPLERGL_BASE_URL__: JSON.stringify('https://kepler.gl'),
      __CARTO_MAPS_API_V2_EXTERNAL_URL_TEMPLATE__: JSON.stringify(PUBLIC_STATICS_CONFIG.CARTO_MAPS_API_V2_EXTERNAL_URL_TEMPLATE),
      __ASSETS_DIR__: JSON.stringify(`${http_path_prefix}/assets/${version}`)
    }),

    new MiniCssExtractPlugin({
      filename: `./${version}/stylesheets/[name].css`
    }),

    new CopyWebpackPlugin([
      {
        from: rootDir('app/assets/images'),
        to: `./${version}/images/`,
        toType: 'dir'
      }, {
        from: rootDir('public/favicons'),
        to: `./${version}/favicons/`,
        toType: 'dir'
      }, {
        from: rootDir('app/assets/images/avatars'),
        to: `./unversioned/images/avatars/`,
        toType: 'dir'
      }, {
        from: rootDir('app/assets/images/alphamarker.png'),
        to: `./unversioned/images/alphamarker.png`,
        toType: 'file'
      }, {
        from: rootDir('app/assets/images/carto.png'),
        to: `./unversioned/images/carto.png`,
        toType: 'file'
      }, {
        from: rootDir('app/assets/images/google-maps-basemap-icons'),
        to: `./unversioned/images/google-maps-basemap-icon`,
        toType: 'dir'
      }, {
        from: rootDir('lib/assets/javascripts/new-dashboard/assets/resources/onboarding'),
        to: `./unversioned/onboarding/`,
        toType: 'dir'
      }
    ]),

    // CSS-only entry points which generate an useless
    // javascript file so we remove it after emitting the files
    new WebpackDeleteAfterEmit({
      globs: [
        `${version}/javascripts/common_new.js`,
        `${version}/javascripts/common_new.js.map`,
        `${version}/javascripts/deep_insights_new.js`,
        `${version}/javascripts/deep_insights_new.js.map`,
        `${version}/javascripts/public_map_new.js`,
        `${version}/javascripts/public_map_new.js.map`,
        `${version}/javascripts/common_editor3.js`,
        `${version}/javascripts/common_editor3.js.map`,
        `${version}/javascripts/editor3.js`,
        `${version}/javascripts/editor3.js.map`
      ]
    }),

    new VueLoaderPlugin(),
    new GearResolverPlugin()
  ],
  optimization: {
    splitChunks: {
      cacheGroups: {
        common: {
          test: module => {
            if (module.nameForCondition && isJavascript(module.nameForCondition())) {
              return true;
            }
            for (const chunk of module.chunksIterable) {
              if (chunk.name && isJavascript(chunk.name)) {
                return true;
              }
            }
            return false;
          },
          chunks: 'initial',
          name: 'common',
          minChunks: 2,
          maxInitialRequests: 5,
          minSize: 0
        },
        common_vendor: {
          test: module => {
            const name = module.nameForCondition && module.nameForCondition();
            if (name && isVendor(name) && isJavascript(name)) {
              return true;
            }
            for (const chunk of module.chunksIterable) {
              if (chunk.name && isVendor(chunk.name) && isJavascript(chunk.name)) {
                return true;
              }
            }
            return false;
          },
          chunks: 'initial',
          name: 'common_vendor',
          priority: 10,
          enforce: true
        }
      }
    }
  },
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
        use: [{
          loader: 'tpl-loader',
          options: {}
        }],
        include: [
          rootDir('lib/assets/javascripts/builder'),
          rootDir('lib/assets/javascripts/dashboard'),
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
        test: /\.js$/,
        loader: 'babel-loader',
        include: [
          rootDir('lib/assets/javascripts/carto-node'),
          rootDir('lib/assets/javascripts/builder'),
          rootDir('lib/assets/javascripts/dashboard'),
          rootDir('lib/assets/javascripts/new-dashboard'),
          rootDir('node_modules/internal-carto.js'),
          rootDir('node_modules/@carto/toolkit-core'),
          rootDir('node_modules/@carto/toolkit-custom-storage'),
          rootDir('node_modules/vue-i18n/'),
          rootDir('node_modules/@deck.gl/core'),
          rootDir('node_modules/@loaders.gl/core'),
          rootDir('node_modules/@loaders.gl/loader-utils'),
          rootDir('node_modules/@loaders.gl/worker-utils'),
          rootDir('node_modules/@carto/viewer')
        ],
        exclude: [
          rootDir('node_modules/internal-carto.js/node_modules'),
          rootDir('node_modules/internal-carto.js/vendor'),
          rootDir('node_modules/@carto/viewer/node_modules'),
          /core-js/
        ],
        options: {
          babelrc: true
        }
      },
      {
        test: /\.s?css$/,
        use: [
          MiniCssExtractPlugin.loader,
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
      },
      {
        test: /\.(ttf|eot|woff|woff2)(.+#.+)?$/,
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
        test: /\.svg$/,
        use: ['@svgr/webpack'],
        include: [
          rootDir('node_modules/@carto/viewer')
        ],
        exclude: [
          rootDir('node_modules/@carto/viewer/node_modules')
        ]
      },
      {
        test: /\.(png|gif|svg|jpg)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: `[name].[ext]`,
            outputPath: `${version}/images/`,
            publicPath: `${http_path_prefix}/assets/${version}/images/`
          }
        }
      },

      // New Dashboard Vue Configuration
      {
        test: /\.vue$/,
        use: [

          {
            loader: 'vue-loader',
            options: vueLoaderConfig
          },
          {
            loader: 'vue-svg-inline-loader'
          }
        ]
      },
      {
        test: /\.html$/,
        use: 'raw-loader',
        include: [
          rootDir('lib/assets/javascripts/new-dashboard/assets/resources/onboarding'),
          rootDir('lib/assets/javascripts/new-dashboard/components/Onboarding/wizard')
        ]
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
