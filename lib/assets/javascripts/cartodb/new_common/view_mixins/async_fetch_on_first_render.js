var cdb = require('cartodb.js');
var _ =   require('underscore');

/**
 * Apply loading (and related) behaviour to a view that needs to fetch dependency data asynchronously on first render
 * call. Once fetching it may be done or fail at some point, or even timeout if considered too slow (defaults to 10s).
 *
 * See args and spec for example usages and defined, expected behaviour.
 *
 * TODO: trigger events on state changes?
 * TODO: clean up any pending stuff (e.g. fetchTimeout) on View.prototype.bind('clean')
 */
module.exports = {

  /**
   * @param View {Backbone.View}
   * @param opts {Hash}
   *   fetch: {Function} will be called with a callback object, call the callback w/o argument for success case,
   *                     or an error message if fetch failed.
   *   timeout: {Function} Called if fetch takes too long (see msBeforeAbortFetch)
   *   fail: {Function} Called if fetch fails.
   *   msBeforeAbortFetch: {Number} (Optional) Defaults to 10s
   * @returns {Object} Configuration
   */
  applyTo: function(View, opts) {
    // Won't fail immediately, but developer should make sure to have test case for the callbacks anyway
    var cfg = _.defaults(opts, {
      fetch:              function(callbacks) { callbacks.fail('Tell a developer to fix this ;)') },
      renderLoading:      function() { throw new Error('provide a renderLoading() function'); },
      timeout:            function() { throw new Error('provide a timeout() function'); },
      failed:             function() { throw new Error('provide a fail(failMsg) function'); },
      done:               function() { this.render(); },
      msBeforeAbortFetch: 10000 //10s
    });

    // Take heed of "this" context to be correct if you'll do changes from here on
    // "this" inside functions here will be pointing to an instance's context, thus the cfg functions needs to be
    // called with this context.
    var originalRender = View.prototype.render;
    _.extend(View.prototype, {
        render: function() {
          if (!this.__isAlreadyFetching()) {
            var fetchTimeout = setTimeout(function() {
              cfg.timeout.call(this);
              this.__isFetching = false;
            }.bind(this), cfg.msBeforeAbortFetch);

            cfg.fetch.call(this, function(error) {
              clearTimeout(fetchTimeout);
              
              if (error !== undefined && error !== null) {
                this.__isFetching = false;
                cfg.failed.call(this, error);
              } else {
                this.render = originalRender;
                cfg.done.call(this);
              }
              
              return this;
            }.bind(this));

            cfg.renderLoading.call(this);
          }

          return this;
        },

      __isAlreadyFetching: function() {
        if (this.__isFetching) {
          return true;
        }
        this.__isFetching = true;
      }
    });

    return cfg;
  }
  
};
