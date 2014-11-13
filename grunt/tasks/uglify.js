
/**
 *  Uglify grunt task for CartoDB.js
 *
 */

module.exports = {
  task: function() {
    return {
      dist: {
        files: {
          '<%= config.dist %>/cartodb.js':             ['<%= config.dist %>/cartodb.uncompressed.js'],
          '<%= config.dist %>/cartodb.core.js':        ['<%= config.dist %>/cartodb.core.uncompressed.js'],
          '<%= config.dist %>/cartodb_nojquery.js':    ['<%= config.dist %>/_cartodb_nojquery.js'],
          '<%= config.dist %>/cartodb_noleaflet.js':   ['<%= config.dist %>/_cartodb_noleaflet.js'],
          '<%= config.dist %>/cartodb.mod.torque.js':  ['<%= config.dist %>/cartodb.mod.torque.uncompressed.js']
        }
      }
    }
  }
}