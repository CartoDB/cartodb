var Backbone = require('backbone');

/**
 * @extends http://backbonejs.org/#Router
 */
module.exports = Backbone.Router.extend({

  /**
   * Placeholder, is replaced by enableAfterMainView.
   */
  navigate: function() {
    throw new Error('router.enableAfterMainView({ ... }) must be called before you can navigate');
  },

  /**
   * Enable router to use pushState and given root URL.
   * Expected to be called after main view as the function name indicates.
   *
   * @param args {Object}
   *   root: {String} (Optional) root URL of page, from where to really route. Not used by default.
   */
  enableAfterMainView: function(args) {
    /**
     * @override http://backbonejs.org/#Router-navigate
     */
    this.navigate = function(fragment, opts) {
      Backbone.Router.prototype.navigate.call(this, this._stripRoot(fragment), opts);
    };

    Backbone.history.start({
      pushState:  true,
      root:       args.root
    });
  },

  _stripRoot: function(fragment) {
    var rootWithoutTrailingSlash = Backbone.history.options.root.replace(/\/+$/, '');
    return fragment.replace(rootWithoutTrailingSlash, '');
  }
});
