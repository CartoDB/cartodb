
/**
 *  Watch grunt task for CartoDB.js
 *
 */

module.exports = {
  task: function() {
    return {
      scss: {
        files: ['themes/scss/**/*.scss'],
        tasks: ['css', 'concat:themes', 'cssmin:themes'],
        options: {
					spawn: false,
					livereload: true
				}
      },
      compass: {
        files: ['<%= config.app %>/_scss/**/*.{scss,sass}'],
        tasks: ['compass:server', 'autoprefixer:server']
      },
      autoprefixer: {
        files: ['<%= config.app %>/css/**/*.css'],
        tasks: ['copy:stageCss', 'autoprefixer:server']
      },
      livereload: {
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        files: [
          '<%= config.app %>/**/*.html',
          '.tmp/css/**/*.css',
          '<%= config.dist %>/themes/css/cartodb.css',
          '{.tmp,<%= config.app %>}/js/**/*.js',
          '<%= config.app %>/img/**/*.{gif,jpg,jpeg,png,svg,webp}'
        ],
        tasks: ['copy:stageStatic']
      }
    }
  }
}
