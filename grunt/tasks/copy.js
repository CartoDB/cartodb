
/**
 *  Copy grunt task for CartoDB.js
 *
 */

var __ = require('underscore');

module.exports = {
  task: function(grunt, config) {
    return {
      options: {
        noProcess: ['**/*.{png,gif,jpg,ico}'],
        process: function (content, srcpath) {

          // Replace string task corrupts images
          if(srcpath.substr(srcpath.length - 3) === '.js') {
            return __.template(content)({
              last_bugfixing_version: config.version.bugfixing,
              last_minor_version:     config.version.minor,
              last_major_version:     config.version.major
            });
          }

          return content;
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
      },

      distStatic: {
        files: [{
          expand: true,
          dot: true,
          cwd: 'themes/img',
          src: [ '**/*.{png,jpg,gif}' ],
          dest: '<%= config.dist %>/themes/img'
        }]
      }
    }
  }
}