/**
 *  Compass task config
 */

exports.task = function () {
  return {
    dist: {
      options: {
        importPath: [
          'tmp/sass/cartoassets'
        ],
        sassDir: 'tmp/sass/editor',
        cssDir: '<%= editor_assets_dir %>/stylesheets',
        fontsDir: '<%= editor_assets_dir %>/fonts',
        httpFontsPath: '<%= env.http_path_prefix %>/assets/editor/<%= editor_assets_version %>/fonts',

        imagesDir: 'app/assets/images/',
        generatedImagesDir: '<%= editor_assets_dir %>/images/',
        httpImagesPath: '<%= env.http_path_prefix %>/assets/editor/<%= editor_assets_version %>/images/',
        httpGeneratedImagesPath: '<%= env.http_path_prefix %>/assets/editor/<%= editor_assets_version %>/images/',

        environment: 'production',
        outputStyle: 'compressed',
        noLineComments: true,
        force: false,
        time: true,
        raw: 'Encoding.default_external = \'utf-8\'\n'
      }
    }
  };
};
