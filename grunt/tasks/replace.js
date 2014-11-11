
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
          }
        ],
        options: {
          replacements: [{
            pattern: '"version": "<%= config.version.bugfixing %>",',
            replacement: '"version": "<%= grunt.config(\'bump.version\') %>",'
          }, {
            pattern: "cdb.VERSION = '<%= config.version.bugfixing %>'",
            replacement: "cdb.VERSION = '<%= grunt.config(\'bump.version\') %>'",
          }]
        }
      }
    }
  }
}
