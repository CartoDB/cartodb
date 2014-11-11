
/**
 *  Replace strings grunt task for CartoDB.js
 *
 */

module.exports = {
  task: function(grunt, config) {
    return {
      dist: {
        files: [
          {
            expand: true,
            cwd: '.',
            src: 'package.json',
            dest: '.'
          },
          {
            expand: true,
            cwd: 'src/',
            src: 'cartodb.js',
            dest: 'src/'
          },
          {
            expand: true,
            cwd: '.',
            src: 'README.md',
            dest: '.'
          },
          {
            expand: true,
            cwd: '.',
            src: 'RELEASING.md',
            dest: '.'
          },
          {
            expand: true,
            cwd: '.',
            src: 'RELEASING.md',
            dest: '.'
          }
        ],
        options: {
          replacements: [{
            pattern: '"version": "<%= config.version.bugfixing %>",',
            replacement: '"version": "<%= grunt.config(\'bump.version\') %>",'
          }, {
            pattern: "cdb.VERSION = '<%= config.version.bugfixing %>'",
            replacement: "cdb.VERSION = '<%= grunt.config(\'bump.version\') %>'",
          }, {
            pattern: "(v<%= config.version.bugfixing %>)",
            replacement: "(v<%= grunt.config('bump.version') %>)",
          }, {
            pattern: "<%= config.version.minor %>",
            replacement: "<%= grunt.config('bump.minor') %>",
          }, {
            pattern: "<%= config.version.bugfixing %>",
            replacement: "<%= grunt.config('bump.version') %>",
          }]
        }
      }
    }
  }
}
