const path = require('path');
const { version } = require('./package.json');

module.exports = {
  outputDir: path.resolve(__dirname, `public/assets/${version}/javascripts`),
  configureWebpack: {
    resolve: {
      alias: {
        'do-catalog': path.resolve(__dirname, 'lib/assets/javascripts/do-catalog/'),
        'new-dashboard': path.resolve(__dirname, 'lib/assets/javascripts/new-dashboard/')
      },
      extensions: ['.js', '.vue', '.json', '.scss']
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
