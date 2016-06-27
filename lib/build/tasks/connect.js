module.exports = {
  task: function () {
    return {
      server: {
        options: {
          port: 8089,
          livereload: true,
          open: true,
          hostname: '0.0.0.0', // to be able to access the server not only from localhost
          base: {
            path: '.'
          }
        }
      }
    };
  }
};
