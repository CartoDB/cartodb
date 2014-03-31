
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
          httpFontsPath:            '<%= env.http_path_prefix %>/assets/<%= pkg.version %>/fonts',

          imagesDir:                '../../app/assets/images/',
          generatedImagesDir:       '<%= assets_dir %>/images/',
          httpImagesPath:           '<%= env.http_path_prefix %>/assets/<%= pkg.version %>/images/',
          httpGeneratedImagesPath:  '<%= env.http_path_prefix %>/assets/<%= pkg.version %>/images/',

          environment:              'production',
          outputStyle:              'compressed',
          noLineComments:           true,
          force:                    false,
          time:                     true
        }
      }
    }
  }
