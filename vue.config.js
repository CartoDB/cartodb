const path = require('path');
const { version } = require('./package.json');

module.exports = {
  runtimeCompiler: true,
  publicPath: '/spatial-data-catalog/browser/',
  outputDir: path.resolve(__dirname, `public/assets/${version}/javascripts`),
  configureWebpack: {
    resolve: {
      alias: {
        'do-catalog': path.resolve(__dirname, 'lib/assets/javascripts/do-catalog/'),
        'new-dashboard': path.resolve(__dirname, 'lib/assets/javascripts/new-dashboard/')
      },
      extensions: ['.js', '.vue', '.json', '.scss']
    },
    performance: {
      maxEntrypointSize: 2048000,
      maxAssetSize: 2048000
    }
  },
  css: {
    extract: false,
    loaderOptions: {
      scss: {
        data: `@import 'do-catalog/main.scss';`
      }
    }
  },
  chainWebpack: config => {
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
