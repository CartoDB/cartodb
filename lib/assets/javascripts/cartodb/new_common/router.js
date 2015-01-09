var Backbone = require('backbone');

/**
 * @extends http://backbonejs.org/#Router With some common functionality in the context of this app.
 */
module.exports = Backbone.Router.extend({

  /**
   * @param args {Object}
   *   root: {String} (Optional) root URL of page, from where to really route. Not used by default.
   */
  initialize: function(args) {
    // Make sure there is not trailing slash, URL's should take care of prefixing the URLs properly.
    this.rootUrl = args.rootUrl.replace(/\/+$/, '') || '';
  },

  /**
   * Placeholder, is replaced by enableAfterMainView().
   */
  navigate: function() {
    throw new Error('router.enableAfterMainView({ ... }) must be called before you can navigate');
  },

  /**
   * Enable router to monitor and manage browser URL and history.
   * Expected to be called after main view as the function name indicates.
   */
  enableAfterMainView: function() {
    /**
     * @override http://backbonejs.org/#Router-navigate Allow
     * @param fragmentOrUrl {String} Either a fragment (e.g. '/dashboard/datasets') or a full URL
     *  (e.g. http://user.cartodb.com/dashboard/datasets), the navigate method takes care to route correctly.
     */
    this.navigate = function(fragmentOrUrl, opts) {
      Backbone.Router.prototype.navigate.call(this, this._normalizeFragmentOrUrl(fragmentOrUrl), opts);
    };

    Backbone.history.start({
      pushState:  true,
      root:       this.rootUrl+'/' //Yes, this trailing slash is necessary for the router to update the history state properly.
    });
  },

  _normalizeFragmentOrUrl: function(str) {
    var rootWithoutTrailingSlashes = this.rootUrl.replace(/\/+$/, '');
    return str.replace(rootWithoutTrailingSlashes, '');
  }
});
