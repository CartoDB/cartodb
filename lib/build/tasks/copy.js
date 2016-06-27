
  /**
   *  Copy task config
   */

  exports.task = function (grunt) {

    return {

      // Vendor stylesheets

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

      cartoassets: {
        expand: true,
        cwd: 'node_modules/cartoassets/src/scss/',
        src: '**/*.scss',
        dest: 'tmp/sass/cartoassets/'
      },

      perfect_scrollbar: {
        expand: true,
        cwd: 'node_modules/perfect-scrollbar/src/css/',
        src: '*.scss',
        dest: 'tmp/sass/deep-insights/'
      },

      colorpicker: {
        expand: true,
        cwd: 'node_modules/bootstrap-colorpicker/dist/css/',
        src: 'bootstrap-colorpicker.css',
        dest: 'tmp/sass/colorpicker/bootstrap-colorpicker/',
        rename: function (dest, src) {
          return dest + src.replace(/\.css$/, '.scss');
        }
      },

      deep_insights: {
        expand: true,
        cwd: 'node_modules/cartodb-deep-insights.js/themes/scss',
        src: '**/*.scss',
        dest: 'tmp/sass/deep-insights/'
      },

      cartodbjs_v4: {
        expand: true,
        cwd: 'node_modules/cartodb.js/themes/scss',
        src: '**/*.scss',
        dest: 'tmp/sass/cartodbjs_v4/'
      },

      iconfont: {
        expand: true,
        cwd: 'node_modules/cartoassets/src/scss/',
        src: 'cdb-icon-font.scss',
        dest: 'tmp/sass/common/'
      },

      cartofonts: {
        files: [{
          expand: true,
          dot: true,
          cwd: 'node_modules/cartoassets/src/fonts',
          src: '**/*.*',
          dest: '<%= assets_dir %>/fonts/'
        }]
      },

      app: {

        files: [

          /**
           *  Stylesheets
           */
            // App stylesheets
          {
            expand: true,
            cwd: 'app/assets/stylesheets/',
            src: ['**/*.css.scss', '**/*.scss'],
            dest: 'tmp/sass/',
            rename: function (dest, src) {
              return dest + src.replace(/\.css.scss$/, '.scss');
            }
          },

            // Vendor stylesheets
          {
            expand: true,
            cwd: 'vendor/assets/stylesheets/',
            src: ['**/*.css.scss', '**/*.scss'],
            dest: 'tmp/sass/',
            rename: function (dest, src) {
              return dest + src.replace(/\.css.scss$/, '.scss');
            }
          },

            // Jasmine stylesheets
          {
            expand: true,
            cwd: 'lib/assets/test/lib/jasmine-1.3.1/',
            src: ['**/*.css'],
            dest: 'tmp/sass/specs/',
            rename: function (dest, src) {
              return dest + src.replace(/\.css$/, '.scss');
            }
          },

            // Embed stylesheets
          {
            expand: true,
            cwd: 'lib/assets/javascripts/cdb/themes/css/',
            src: ['cartodb.css'],
            dest: '<%= assets_dir %>/stylesheets/tmp/embeds/',
            rename: function (dest, src) {
              return dest + src.replace(/\.css$/, '.scss');
            }
          },

          /**
           *  Images
           */

            // public images

          {
            expand: true,
            cwd: 'app/assets/images/',
            src: ['**/*'],
            dest: '<%= assets_dir %>/images/'
          },

          // avatars should be placed in a unversioned folder
          {
            expand: true,
            cwd: "app/assets/images/avatars/",
            src: ['**/*'],
            dest: '<%= root_assets_dir %>/unversioned/images/avatars/'
          },

            // CartoDB.js images

          {
            expand: true,
            cwd: 'lib/assets/javascripts/cdb/themes/img/',
            src: ['**/*'],
            dest: '<%= assets_dir %>/images/themes/'
          },

          /**
           *  Fonts
           */

          {
            expand: true,
            cwd: 'app/assets/fonts/',
            src: ['*.{svg,ttf,eot,woff,woff2}'],
            dest: '<%= assets_dir %>/fonts/'
          },

          {
            expand: true,
            cwd: 'vendor/assets/fonts/',
            src: ['*.{svg,ttf,eot,woff,woff2}'],
            dest: '<%= assets_dir %>/fonts/'
          },

          /**
           *  Flash
           */

          {
            expand: true,
            cwd: 'app/assets/flash/',
            src: ['**/*'],
            dest: '<%= assets_dir %>/flash/'
          },

          /**
           *  Favicons
           */

          {
            expand: true,
            cwd: 'public/favicons/',
            src: ['**/*'],
            dest: '<%= assets_dir %>/favicons/'
          }
        ]
      },

      js: {
        expand: true,
        cwd: '<%= assets_dir %>/javascripts/',
        src: ['**/*.js'],
        dest: '<%= assets_dir %>/javascripts/',
        rename: function (dest, src) {
          return dest + src.replace(/\.js$/, '.uncompressed.js');
        }
      }
    };
  };
