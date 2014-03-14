
  /**
   *  Compass task config
   */

  exports.task = function() {
    
    return {
      dist: {
        options: {
          importPath:               '../../app/assets/stylesheets/tmp/common',
          
          sassDir:                  '../../app/assets/stylesheets/tmp',
          cssDir:                   '../../public/stylesheets',
          fontsDir:                 '../../public/fonts',
          httpFontsPath:            '/fonts/',
          httpFontsDir:             '/fonts/',

          imagesDir:                '../../app/assets/images/',
          generatedImagesDir:       '../../public/images/',
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