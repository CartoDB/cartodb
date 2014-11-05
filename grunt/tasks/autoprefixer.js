
/**
 *  Autoprefixer grunt task for CartoDB.js
 *
 */

module.exports = {
  task: function() {
    return {
      options: {
        browsers: [ '> 5%', 'ie > 6' ]
      },
      dist: {
        files: [{
          expand: true,
          cwd: '<%= config.dist %>/<%= config.app %>/css',
          src: '**/*.css',
          dest: '<%= config.dist %>/<%= config.app %>/css'
        }]
      },
      server: {
        files: [{
          expand: true,
          cwd: '.tmp/css',
          src: '**/*.css',
          dest: '.tmp/css'
        }]
      }
    }
  }
}