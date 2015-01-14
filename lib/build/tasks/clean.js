
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
        "app/assets/stylesheets/tmp",
        "<%= assets_dir %>"
      ]
    }
  }
