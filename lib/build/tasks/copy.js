
  /**
   *  Copy task config
   */

  exports.task = function() {
    
    return {
      dist: {

        options: {
          // Change all routes from img to images
          // within any .CSS file
          noProcess: '**/*.{png,gif,jpg,ico,swf,scss,eot,woff,svg,ttf}',

          mode: true,

          // process: function (content, srcpath) {
          //   return content.replace((/\/img\//gi,"/images/themes/"));
          // }
        },

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

            // CartoDB theme stylesheet
          {
            expand: true,
            cwd: '../../lib/assets/javascripts/cdb/themes/css/',
            src: ['cartodb.css'],
            dest: '<%= assets_dir %>/stylesheets/tmp/embeds/',
            rename: function(dest, src) {
              return dest + src.replace(/\.css$/, ".scss");
            }
          },

            // Vendor stylesheets
          {
            expand: true,
            cwd: '../../vendor/assets/stylesheets/',
            src: ['**/*.css'],
            dest: '../../app/assets/stylesheets/tmp/vendor/',
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
          }
        ]
      }
    }
  };