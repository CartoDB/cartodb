
  /**
   *  Clean task config
   */

  exports.task = function() {

    return {
      options: {
        force: true
      },
      src: [
        "./.sass-cache",
        "../../app/assets/stylesheets/tmp",
        "<%= assets_dir %>"
      ]
    }
  }
