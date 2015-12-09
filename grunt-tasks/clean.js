module.exports = {
  dist: {
    files: [{
      dot: true,
      src: [
        '.sass-cache',
        '.tmp',
        '<%= config.dist %>',
        '!<%= config.dist %>/.git*'
      ]
    }]
  }
}
