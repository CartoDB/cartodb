  
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
        "../../public/flash",
        "../../public/fonts",
        "../../public/images",
        "../../public/javascripts",
        "../../public/stylesheets"
      ]
    }
  }