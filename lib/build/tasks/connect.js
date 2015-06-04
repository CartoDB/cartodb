module.exports = {
  task: function() {
    return {
      jasmine: {
        options: {
          port: 8089,
          livereload: true,
          base: {
            path: '.',
            options: {
              index: '_SpecRunner.html'
            }
          }
        }
      }
    };
  }
};
