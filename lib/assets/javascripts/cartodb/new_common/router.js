var Backbone = require('backbone');

/**
 * @extends http://backbonejs.org/#Router With some common functionality in the context of this app.
 */
module.exports = Backbone.Router.extend({

  /**
   * @param args {Object}
   *   currentUserUrl: {Object} instance of new_common/urls/user/*_model
   */
  initialize: function(args) {
    this.currentUserUrl = args.currentUserUrl;
    this._rootUrl = this.currentUserUrl.toStr();
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
      root:       this._rootUrl +'/' //Yes, this trailing slash is necessary for the router to update the history state properly.
    });
  },

  _normalizeFragmentOrUrl: function(str) {
    return str.replace(this._rootUrl, '');
  }
});
