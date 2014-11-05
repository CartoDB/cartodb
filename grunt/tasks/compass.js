
/**
 *  Compass grunt task for CartoDB.js
 *
 */

module.exports = {
  task: function() {
    return {
      options: {
        bundleExec: true,
        sassDir: '<%= config.app %>/_scss',
        cssDir: '<%= config.app %>/css',
        imagesDir: '<%= config.app %>/img',
        javascriptsDir: '<%= config.app %>/js',
        relativeAssets: false,
        httpImagesPath: '/img',
        httpGeneratedImagesPath: '/img/generated',
        outputStyle: 'expanded',
        raw: 'extensions_dir = "<%= config.app %>/_bower_components"\n'
      },
      dist: {
        options: {
          generatedImagesDir: '<%= config.dist %>/<%= config.app %>/img/generated'
        }
      },
      server: {
        options: {
          debugInfo: true,
          generatedImagesDir: '.tmp/img/generated'
        }
      }
    }
  }
}