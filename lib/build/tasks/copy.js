
  /**
   *  Copy task config
   */

  exports.init = {
    dist: {
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
          dest: '../../app/assets/stylesheets/tmp/embeds/',
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

        {
          expand: true,
          cwd: '../../app/assets/images/',
          src: ['**/*'],
          dest: '../../public/images/'
        },

        /**
         *  Fonts
         */

        {
          expand: true,
          cwd: '../../app/assets/fonts/',
          src: ['**/*'],
          dest: '../../public/fonts/'
        },

        /**
         *  Flash
         */

        {
          expand: true,
          cwd: '../../app/assets/flash/',
          src: ['**/*'],
          dest: '../../public/flash/'
        }
      ]
    }
  };