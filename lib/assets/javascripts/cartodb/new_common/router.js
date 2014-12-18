var Backbone = require('backbone');

/**
 * @extends http://backbonejs.org/#Router With some common functionality in the context of this app.
 */
module.exports = Backbone.Router.extend({


  /**
   * Enable router to use pushState and given root URL.
   * Expected to be called after main view as the function name indicates.
   *
   * @param args {Object}
   *   root: {String} (Optional) root URL of page, from where to really route. Not used by default.
   */
  enableAfterMainView: function(args) {
    Backbone.history.start({
      pushState:  true,
      root:       args.root
    });
  }
});
