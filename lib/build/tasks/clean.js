
  /**
   *  Clean task config
   */

  exports.task = function() {

    return {
      options: {
        force: true
      },
      src: [
        "lib/build/app_config.js",
        ".sass-cache",
        "tmp/sass",
        "<%= assets_dir %>",
        ".grunt"
      ]
    }
  }
