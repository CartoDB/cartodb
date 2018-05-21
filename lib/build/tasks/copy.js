/**
 *  Copy task config
 */

exports.task = function (grunt) {
  return {
    vendor: {
      expand: true,
      cwd: 'vendor/assets/stylesheets/',
      src: ['**/*.css'],
      dest: 'tmp/sass/vendor/',
      rename: function (dest, src) {
        return dest + src.replace(/\.css$/, '.scss');
      },
      options: {
        // Change all routes from img to asset version path
        process: function (content, srcpath) {
          // return content.replace(/\.\.\/img/gi,"/assets/<%= pkg.version %>/images/themes");
          var path = grunt.template.process('<%= env.http_path_prefix %>/assets/<%= pkg.version %>/images/themes');
          return content.replace(/\.\.\/img/gi, path);
        }
      }
    },

    app: {
      files: [{
        expand: true,
        dot: true,
        cwd: 'node_modules/cartoassets/src/fonts',
        src: '**/*.*',
        dest: '<%= assets_dir %>/fonts/'
      }, {
        expand: true,
        cwd: 'node_modules/cartoassets/src/scss/',
        src: '**/*.scss',
        dest: 'tmp/sass/cartoassets/'
      }, {
        expand: true,
        cwd: 'node_modules/bootstrap-colorpicker/dist/css/',
        src: 'bootstrap-colorpicker.css',
        dest: 'tmp/sass/colorpicker/bootstrap-colorpicker/',
        rename: function (dest, src) {
          return dest + src.replace(/\.css$/, '.scss');
        }
      }, {
        expand: true,
        cwd: 'app/assets/stylesheets/deep-insights/themes/scss',
        src: '**/*.scss',
        dest: 'tmp/sass/deep-insights/'
      }, {
        expand: true,
        cwd: 'node_modules/internal-carto.js/themes/scss',
        src: '**/*.scss',
        dest: 'tmp/sass/cartodbjs_v4/'
      }, {
        expand: true,
        cwd: 'lib/assets/javascripts/cdb/themes/css/',
        src: ['cartodb.css'],
        dest: '<%= assets_dir %>/stylesheets/tmp/embeds/',
        rename: function (dest, src) {
          return dest + src.replace(/\.css$/, '.scss');
        }
      }, {
        // Client stylesheets
        expand: true,
        cwd: 'app/assets/client/stylesheets/',
        src: ['**/*.scss'],
        dest: 'tmp/sass/client/',
        rename: function (dest, src) {
          return dest + src.replace(/\.css.scss$/, '.scss');
        }
      }, {
        expand: true,
        cwd: 'app/assets/images/',
        src: ['**/*'],
        dest: '<%= assets_dir %>/images/'
      }, {
        // Some images should be placed in a unversioned folder
        expand: true,
        cwd: 'app/assets/images/',
        src: ['avatars/*.png', 'alphamarker.png', 'google-maps-basemap-icons/*.jpg', 'carto.png'],
        dest: '<%= root_assets_dir %>/unversioned/images/'
      }, {
        // CARTO.js images
        expand: true,
        cwd: 'lib/assets/javascripts/cdb/themes/img/',
        src: ['**/*'],
        dest: '<%= assets_dir %>/images/themes/'
      }, {
        // Fonts
        expand: true,
        cwd: 'app/assets/fonts/',
        src: ['*.{svg,ttf,eot,woff,woff2}'],
        dest: '<%= assets_dir %>/fonts/'
      }, {
        // Client fonts
        expand: true,
        cwd: 'app/assets/client/fonts/',
        src: ['*.{svg,ttf,eot,woff,woff2}'],
        dest: '<%= assets_dir %>/fonts/'
      }, {
        // Flash
        expand: true,
        cwd: 'app/assets/flash/',
        src: ['**/*'],
        dest: '<%= assets_dir %>/flash/'
      }, {
        // Favicons
        expand: true,
        cwd: 'public/favicons/',
        src: ['**/*'],
        dest: '<%= assets_dir %>/favicons/'
      }, {
        // Client favicons
        expand: true,
        cwd: 'app/assets/client/favicons/',
        src: ['**/*'],
        dest: '<%= assets_dir %>/favicons/'
      }]
    },

    css_cartodb: {
      files: [{
        // TODO: remove editor
        expand: true,
        cwd: 'app/assets/stylesheets',
        src: [
          '**/*.scss',
          '!editor-3/**/*.scss',
          '!new_dashboard/**/*.scss'
        ],
        dest: 'tmp/sass/editor/',
        rename: function (dest, src) {
          return dest + src.replace(/\.css.scss$/, '.scss');
        }
      }]
    },

    css_builder: {
      files: [{
        // TODO: remove editor
        expand: true,
        cwd: 'app/assets/stylesheets/editor-3/',
        src: ['**/*.scss'],
        dest: 'tmp/sass/editor-3/'
      }]
    },

    css_dashboard: {
      files: [{
        // TODO: remove editor
        expand: true,
        cwd: 'app/assets/stylesheets/new_dashboard/',
        src: ['**/*.scss'],
        dest: 'tmp/sass/new_dashboard/'
      }]
    },

    css_vendor_builder: {
      files: [{
        expand: true,
        cwd: 'node_modules/cartoassets/src/scss/',
        src: '**/*.scss',
        dest: 'tmp/sass/cartoassets/'
      }, {
        expand: true,
        cwd: 'app/assets/stylesheets/deep-insights/themes/scss',
        src: '**/*.scss',
        dest: 'tmp/sass/deep-insights/'
      }, {
        expand: true,
        cwd: 'node_modules/internal-carto.js/themes/scss',
        src: '**/*.scss',
        dest: 'tmp/sass/cartodbjs_v4/'
      }]
    },

    js: {
      files: [{
        expand: true,
        cwd: '<%= assets_dir %>/javascripts/',
        src: ['**/*.js'],
        dest: '<%= assets_dir %>/javascripts/',
        rename: function (dest, src) {
          return dest + src.replace(/\.js$/, '.uncompressed.js');
        }
      }]
    }
  };
};
