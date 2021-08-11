const webpack = require('webpack');
const path = require('path');
const { http_path_prefix } = require(`./config/grunt_${process.env.NODE_ENV}.json`);
const { version } = require('./package.json');

module.exports = {
  runtimeCompiler: true,
  transpileDependencies: ['@mapbox/martini', 'd3-array', 'd3-scale'],
  publicPath: '/spatial-data-catalog/browser/',
  outputDir: path.resolve(__dirname, `public/assets/${version}/javascripts`),
  configureWebpack: {
    resolve: {
      alias: {
        'do-catalog': path.resolve(__dirname, 'lib/assets/javascripts/do-catalog/'),
        'tilesets-viewer': path.resolve(__dirname, 'lib/assets/javascripts/tilesets-viewer/'),
        'new-dashboard': path.resolve(__dirname, 'lib/assets/javascripts/new-dashboard/')
      },
      extensions: ['.js', '.vue', '.json', '.scss']
    },
    performance: {
      maxEntrypointSize: 2048000,
      maxAssetSize: 2048000
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          use: [
            {
              loader: 'vue-svg-inline-loader'
            }
          ]
        }
      ]
    },
    plugins: [
      new webpack.DefinePlugin({
        __ASSETS_DIR__: JSON.stringify(`${http_path_prefix}/assets/${version}`)
      })
    ]
  },
  css: {
    extract: false,
    loaderOptions: {
      scss: {
        data: "@import 'do-catalog/main.scss';"
      }
    }
  },
  chainWebpack: config => {
    config.module.rule('js')
      .use('babel-loader').loader('babel-loader');
    if (process.env.NODE_ENV === 'production') {
      config.module.rule('images').use('url-loader')
        .loader('file-loader')
        .tap(options => Object.assign(options, {
          name: '../images/do-catalog/[name].[hash:8].[ext]'
        }));
      config.module.rule('svg').use('file-loader')
        .tap(options => Object.assign(options, {
          name: '../images/do-catalog/[name].[hash:8].[ext]'
        }));
    }
  }
};
