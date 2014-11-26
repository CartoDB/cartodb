
/**
 *  Replace strings grunt task for CartoDB.js
 *
 */

module.exports = {
  task: function(grunt, config) {
    return {
      
      cdb: {
        options: {
          patterns: [{
            match: '/cdb.VERSION = "<%= config.version.bugfixing %>"/g',
            replacement: 'cdb.VERSION = "<%= grunt.config(\'bump.version\') %>"',
            expression: true
          }]
        },
        files: [{
          expand: true,
          flatten: true,
          src: ['src/cartodb.js'],
          dest: 'src/'
        }]
      },

      pkg: {
        options: {
          patterns: [{
            match: '/"version": "<%= config.version.bugfixing %>"/g',
            replacement: '"version": "<%= grunt.config(\'bump.version\') %>"',
            expression: true
          }]
        },
        files: [{
          expand: true,
          flatten: true,
          src: ['package.json'],
          dest: ''
        }]
      },

      readme: {
        options: {
          patterns: [{
            match: '/<%= config.version.minor %>/gi',
            replacement: "<%= grunt.config('bump.minor') %>",
            expression: true
          }]
        },
        files: [{
          expand: true,
          flatten: true,
          src: ['README.md'],
          dest: ''
        }]
      },

      api: {
        options: {
          patterns: [{
            match: '/\/<%= config.version.minor %>\//gi',
            replacement: "/<%= grunt.config('bump.minor') %>/",
            expression: true
          },{
            match: '/<%= config.version.bugfixing %>/gi',
            replacement: "<%= grunt.config('bump.version') %>",
            expression: true
          }]
        },
        files: [{
          expand: true,
          flatten: true,
          src: ['doc/API.md'],
          dest: 'doc/'
        }]
      },

      examples: {
        options: {
          patterns: [{
            match: '/\/<%= config.version.minor %>\//gi',
            replacement: "/<%= grunt.config('bump.minor') %>/",
            expression: true
          }]
        },
        files: [{
          expand: true,
          flatten: true,
          src: ['examples/**/*.html'],
          dest: 'examples/'
        }]
      },

      releasing: {
        options: {
          patterns: [{
            match: '/\/<%= config.version.minor %>\//gi',
            replacement: "/<%= grunt.config('bump.minor') %>/",
            expression: true
          },{
            match: '/<%= config.version.bugfixing %>/gi',
            replacement: "<%= grunt.config('bump.version') %>",
            expression: true
          }]
        },
        files: [{
          expand: true,
          flatten: true,
          src: ['RELEASING.md'],
          dest: ''
        }]
      }
    }
  }
}

          // {
          //   expand: true,
          //   cwd: '.',
          //   src: 'package.json',
          //   dest: '.'
          // },
          // {
          //   expand: true,
          //   cwd: 'src/',
          //   src: 'cartodb.js',
          //   dest: 'src/'
          // },

          // {
          //   match: '"version": "<%= config.version.bugfixing %>",',
          //   replacement: '"version": "<%= grunt.config(\'bump.version\') %>",'
          // }, {
          //   match: "cdb.VERSION = '<%= config.version.bugfixing %>'",
          //   replacement: "cdb.VERSION = '<%= grunt.config(\'bump.version\') %>'",
          // },