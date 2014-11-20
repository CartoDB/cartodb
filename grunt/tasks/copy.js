
/**
 *  Copy grunt task for CartoDB.js
 *
 */

var __ = require('underscore');
var findup = require('findup-sync');

module.exports = {
  task: function(grunt, config) {
    return {
      options: {
        noProcess: ['**/*.{png,gif,jpg,ico}'],
        process: function (content, srcpath) {

          // Replace string task corrupts images
          if(srcpath.substr(srcpath.length - 3) === '.js' || srcpath.substr(srcpath.length - 5) === '.html') {

            // Get all examples
            var examples = [];

            grunt.file.expand("examples/*").forEach(function (dir) {
              var path = dir + '/demo.details';
              if (grunt.file.exists(path)) {
                var data = grunt.file.readYAML(path);
                data.dir = dir.replace('examples/', '');
                examples.push(data);
              }
            });

            return __.template(content)({
              last_bugfixing_version: config.version.bugfixing,
              last_minor_version:     config.version.minor,
              last_major_version:     config.version.major,
              examples:               examples
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