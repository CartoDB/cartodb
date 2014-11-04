
/**
 *  Copy grunt task for CartoDB.js
 *
 */

module.exports = {
  task: function(grunt, config) {
    return {
      options: {
        process: function (content, srcpath) {
          var version_arr = config.pkg.version.split('.');
          return content
            .replace(/\{\{ last-bugfixing-version \}\}/g, version_arr.join('.'))
            .replace(/\{\{ last-minor-version \}\}/g, version_arr[0] + '.' + version_arr[1])
            .replace(/\{\{ last-version \}\}/g, version_arr[0]);
        }
      },

      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= config.app %>',
          src: [
            '**/*.html',
            'sitemap.xml',
            'robots.txt',
            'img/**/*',
            'fonts/**/*',
            '!**/_*{,/**}',
            'favicon.ico'
          ],
          dest: '<%= config.dist %>'
        }]
      },

      stageCss: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= config.app %>/css',
          src: '**/*.css',
          dest: '.tmp/css'
        }]
      },

      stageStatic: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= config.app %>',
          src: [
            '**/*.html',
            'sitemap.xml',
            'robots.txt',
            'img/**/*',
            'fonts/**/*',
            '!**/_*{,/**}',
            'favicon.ico'
          ],
          dest: '.tmp'
        }]
      }
    }
  }
}