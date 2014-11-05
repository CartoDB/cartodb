
/**
 *  Copy grunt task for CartoDB.js
 *
 */

var __ = require('underscore');

module.exports = {
  task: function(grunt, config) {
    return {
      options: {
        process: function (content, srcpath) {
          return __.template(content)({
            last_bugfixing_version: config.version.bugfixing,
            last_minor_version:     config.version.minor,
            last_major_version:     config.version.major
          });
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
          dest: '<%= config.dist %>/<%= config.app %>'
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