
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
        ".grunt",
        "lib/assets/javascripts/cartodb3",
        "lib/assets/test/{spec,jasmine}/cartodb3",
        "lib/assets/locale"
      ]
    }
  }
