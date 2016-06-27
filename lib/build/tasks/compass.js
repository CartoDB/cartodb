/**
 *  Compass task config
 */

exports.task = function () {
  return {
    dist: {
      options: {
        importPath: [
          'tmp/sass/common',
          'tmp/sass/cartoassets'
        ],
        sassDir: 'tmp/sass',
        cssDir: '<%= assets_dir %>/stylesheets',
        specify: [
          'tmp/sass/**/*.scss',
          '!tmp/sass/deep-insights/**/*.scss',
          'tmp/sass/deep-insights/main.scss',
          'tmp/sass/deep-insights/entry.scss',
          '!tmp/sass/cartodbjs_v4/**/*.scss',
          'tmp/sass/cartodbjs_v4/entry.scss'
        ],
        fontsDir: '<%= assets_dir %>/fonts',
        httpFontsPath: '<%= env.http_path_prefix %>/assets/<%= pkg.version %>/fonts',

        imagesDir: 'app/assets/images/',
        generatedImagesDir: '<%= assets_dir %>/images/',
        httpImagesPath: '<%= env.http_path_prefix %>/assets/<%= pkg.version %>/images/',
        httpGeneratedImagesPath: '<%= env.http_path_prefix %>/assets/<%= pkg.version %>/images/',

        environment: 'production',
        outputStyle: 'compressed',
        noLineComments: true,
        force: false,
        time: true
      }
    }
  };
};
