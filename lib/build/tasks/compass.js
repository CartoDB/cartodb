
  /**
   *  Compass task config
   */

  exports.task = function() {

    return {
      dist: {
        options: {
          importPath:               '../../app/assets/stylesheets/tmp/common',

          sassDir:                  '../../app/assets/stylesheets/tmp',
          cssDir:                   '<%= assets_dir %>/stylesheets',
          fontsDir:                 '<%= assets_dir %>/fonts',
          httpFontsPath:            '/fonts/',
          httpFontsDir:             '/fonts/',

          imagesDir:                '../../app/assets/images/',
          generatedImagesDir:       '<%= assets_dir %>/images/',
          httpImagesPath:           '/images/',
          httpGeneratedImagesPath:  '/images/',

          environment:              'production',
          outputStyle:              'compressed',
          noLineComments:           true,
          force:                    false,
          time:                     true
        }
      }
    }
  }
