module.exports = {
  server: {
    options: {
      port: 9002,
      livereload: 35732,
      open: true,
      hostname: '0.0.0.0', // to be able to access the server not only from localhost
      base: {
        path: '.'
      }
    }
  }
}
