/**
 *  entry point for api keys and oauth
 */


$(function() {

    var ApiKeys = cdb.core.View.extend({

        el: document.body,

        events: {},

        initialize: function() {
          // Tipsy?

          // Copy?

        }
    });


    cdb.init(function() {
      var keys = new ApiKeys();
      // expose to debug
      window.keys = keys;
    });
});
