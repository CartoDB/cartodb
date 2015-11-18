/**
 *  Copy grunt task for CartoDB.js
 *
 */
var __ = require('underscore');
var findup = require('findup-sync');

module.exports = {
  task: function(grunt, config) {
    return {
      fonts: {
        files: [{
          expand: true,
          cwd: 'themes/fonts/',
          src: ['**/*'],
          dest: '<%= config.dist %>/fonts/'
        }]
      }
      // options: {
      //   noProcess: ['**/*.{png,gif,jpg,ico,svg}'],
      //   process: function (content, srcpath) {
      //
      //     // Replace string task corrupts images
      //     if(srcpath.substr(srcpath.length - 3) === '.js' || srcpath.substr(srcpath.length - 5) === '.html') {
      //
      //       // Get all examples
      //       var examples = [];
      //
      //       grunt.file.expand("examples/*").forEach(function (dir) {
      //         var path = dir + '/demo.details';
      //         if (grunt.file.exists(path)) {
      //           var data = grunt.file.readYAML(path);
      //           data.dir = dir.replace('examples/', '');
      //           examples.push(data);
      //         }
      //       });
      //
      //       return __.template(content)({
      //         last_bugfixing_version: config.version.bugfixing,
      //         last_minor_version:     config.version.minor,
      //         last_major_version:     config.version.major,
      //         examples:               examples
      //       });
      //     }
      //
      //     return content;
      //   }
      // }
    }
  }
}
