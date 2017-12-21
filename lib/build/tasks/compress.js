
module.exports = {
  task: function() {
    return {
      javascripts: {
        options: {
          mode: 'gzip'
        },
        expand: true,
        cwd: '<%= assets_dir %>/javascripts/',
        src: ['**/*.min.js'],
        dest: '<%= assets_dir %>/javascripts/',
        ext: '.js'
      },
      css: {
        options: {
          mode: 'gzip'
        },
        expand: true,
        cwd: '<%= assets_dir %>/stylesheets/',
        src: ['**/*.css'],
        dest: '<%= assets_dir %>/stylesheets/',
        ext: '.css'
      }
    }
  }
}
