
  /**
   *  Copy task config
   */

  exports.task = function(grunt) {

    return {

      // Vendor stylesheets

      vendor: {
        expand: true,
        cwd: '../../vendor/assets/stylesheets/',
        src: ['**/*.css'],
        dest: '../../app/assets/stylesheets/tmp/vendor/',
        rename: function(dest, src) {
          return dest + src.replace(/\.css$/, ".scss");
        },
        options: {
          // Change all routes from img to asset version path
          process: function (content, srcpath) {
            // return content.replace(/\.\.\/img/gi,"/assets/<%= pkg.version %>/images/themes");
            var path = grunt.template.process("<%= env.http_path_prefix %>/assets/<%= pkg.version %>/images/themes")
            return content.replace(/\.\.\/img/gi, path);
          }
        }
      },

      app: {

        files: [

          /**
           *  Stylesheets
           */

            // App stylesheets
          {
            expand: true,
            cwd: '../../app/assets/stylesheets/',
            src: ['**/*.css.scss'],
            dest: '../../app/assets/stylesheets/tmp/',
            rename: function(dest, src) {
              return dest + src.replace(/\.css.scss$/, ".scss");
            }
          },

            // Jasmine stylesheets
          {
            expand: true,
            cwd: '../../lib/assets/test/lib/jasmine-1.3.1/',
            src: ['**/*.css'],
            dest: '../../app/assets/stylesheets/tmp/specs/',
            rename: function(dest, src) {
              return dest + src.replace(/\.css$/, ".scss");
            }
          },

            // Embed stylesheets
          {
            expand: true,
            cwd: '../../lib/assets/javascripts/cdb/themes/css/',
            src: ['cartodb.css'],
            dest: '<%= assets_dir %>/stylesheets/tmp/embeds/',
            rename: function(dest, src) {
              return dest + src.replace(/\.css$/, ".scss");
            }
          },

          /**
           *  Images
           */

            // public images

          {
            expand: true,
            cwd: '../../app/assets/images/',
            src: ['**/*'],
            dest: '<%= assets_dir %>/images/'
          },

            // CartoDB.js images

          {
            expand: true,
            cwd: '../../lib/assets/javascripts/cdb/themes/img/',
            src: ['**/*'],
            dest: '<%= assets_dir %>/images/themes/'
          },

          /**
           *  Fonts
           */

          {
            expand: true,
            cwd: '../../app/assets/fonts/',
            src: ['**/*'],
            dest: '<%= assets_dir %>/fonts/'
          },

          /**
           *  Flash
           */

          {
            expand: true,
            cwd: '../../app/assets/flash/',
            src: ['**/*'],
            dest: '<%= assets_dir %>/flash/'
          },

          /**
           *  Favicons
           */

          {
            expand: true,
            cwd: '../../public/favicons/',
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
        rename: function(dest, src) {
          return dest + src.replace(/\.js$/, ".uncompressed.js");
        }
      }
    }
  };
