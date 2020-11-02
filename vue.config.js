const path = require('path');
const { version } = require('./package.json');

module.exports = {
  runtimeCompiler: true,
  outputDir: path.resolve(__dirname, `public/assets/${version}/export`),
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
      maxAssetSize: 1024000
    }
  },
  css: {
    loaderOptions: {
      scss: {
        data: `@import 'do-catalog/main.scss';`
      }
    }
  }
};
