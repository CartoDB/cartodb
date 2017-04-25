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
        cwd: 'node_modules/perfect-scrollbar/src/css/',
        src: '*.scss',
        dest: 'tmp/sass/deep-insights/'
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
        cwd: 'node_modules/cartodb-deep-insights.js/themes/scss',
        src: '**/*.scss',
        dest: 'tmp/sass/deep-insights/'
      }, {
        expand: true,
        cwd: 'node_modules/cartodb.js/themes/scss',
        src: '**/*.scss',
        dest: 'tmp/sass/cartodbjs_v4/'
      }, {
        // TODO: remove editor
        expand: true,
        cwd: 'app/assets/stylesheets/editor',
        src: ['**/*.css.scss', '**/*.scss'],
        dest: 'tmp/sass/editor/',
        rename: function (dest, src) {
          return dest + src.replace(/\.css.scss$/, '.scss');
        }
      }, {
        // TODO: remove editor
        expand: true,
        cwd: 'app/assets/stylesheets/builder',
        src: ['**/*.scss'],
        dest: 'tmp/sass/builder/',
        rename: function (dest, src) {
          return dest + src.replace(/\.css.scss$/, '.scss');
        }
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
        src: [
          '**/*.css.scss',
          '**/*.scss'
        ],
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
        src: ['avatars/**/*', 'alphamarker.png', 'google-maps-basemap-icons/*'],
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

    css_tests: {
      expand: true,
      cwd: 'lib/assets/test/lib/jasmine-1.3.1/',
      src: ['**/*.css'],
      dest: 'tmp/sass/specs/',
      rename: function (dest, src) {
        return dest + src.replace(/\.css$/, '.scss');
      }
    },

    js_cartodb: {
      files: [
        {
          expand: true,
          cwd: 'lib/assets/core/javascripts/cartodb/organization/',
          src: ['**/*'],
          dest: 'lib/assets/javascripts/cartodb/organization/'
        } , {
          expand: true,
          cwd: 'lib/assets/client/javascripts/cartodb/organization/',
          src: ['**/*'],
          dest: 'lib/assets/javascripts/cartodb/organization/'
        }
      ]
    },

    js_cartodb3: {
      files: [
        {
          expand: true,
          cwd: 'lib/assets/core/javascripts/cartodb3/',
          src: ['**/*'],
          dest: 'lib/assets/javascripts/cartodb3/'
        }, {
          expand: true,
          cwd: 'lib/assets/client/javascripts/cartodb3/',
          src: ['**/*'],
          dest: 'lib/assets/javascripts/cartodb3/'
        }
      ]
    },

    js_test_spec_cartodb3: {
      files: [
        {
          expand: true,
          cwd: 'lib/assets/core/test/spec/cartodb3/',
          src: ['**/*'],
          dest: 'lib/assets/test/spec/cartodb3/'
        } , {
          expand: true,
          cwd: 'lib/assets/client/test/spec/cartodb3/',
          src: ['**/*'],
          dest: 'lib/assets/test/spec/cartodb3/'
        }
      ]
    },

    js_test_jasmine_cartodb3: {
      files: [
        {
          expand: true,
          cwd: 'lib/assets/core/test/jasmine/cartodb3/',
          src: ['**/*'],
          dest: 'lib/assets/test/jasmine/cartodb3/'
        } , {
          expand: true,
          cwd: 'lib/assets/client/test/jasmine/cartodb3/',
          src: ['**/*'],
          dest: 'lib/assets/test/jasmine/cartodb3/'
        }
      ]
    },

    locale: {
      files: [
        {
          expand: true,
          cwd: 'lib/assets/core/locale/',
          src: ['**/*'],
          dest: 'lib/assets/locale/'
        }, {
          expand: true,
          cwd: 'lib/assets/client/locale/',
          src: ['**/*'],
          dest: 'lib/assets/locale/'
        }
      ]
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
