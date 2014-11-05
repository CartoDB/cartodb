
/**
 *  Build control grunt task for CartoDB.js
 *
 */

module.exports = {
  task: function() {
    return {
      options: {
        dir: '<%= config.dist %>/<%= config.app %>',
        commit: true,
        push: true,
        message: 'Built %sourceName% from commit %sourceCommit%, version <%= pkg.version %>, on branch %sourceBranch%.'
      },
      pages: {
        options: {
          remote: 'git@github.com:cartodb/cartodb.js.git',
          branch: 'gh-pages'
        }
      }
    }
  }
}