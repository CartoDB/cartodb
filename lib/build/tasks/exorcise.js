// Source maps
module.exports = {
  task: function() {
    return {
      test: {
        options: {},
        files: {
          'test/test_bundle.map': ['test/test_bundle.js']
        }
      }
    }
  }
};
