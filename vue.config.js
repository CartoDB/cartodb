const path = require('path');

module.exports = {
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
