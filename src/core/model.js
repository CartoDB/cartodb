(function() {

  /**
   * Base Model for all CartoDB model.
   * DO NOT USE Backbone.Model directly
   * @class cdb.core.Model
   */
  var Model = cdb.core.Model = Backbone.Model.extend({
    /**
    * We are redefining fetch to be able to trigger an event when the ajax call ends, no matter if there's
    * a change in the data or not. Why don't backbone does this by default? ahh, my friend, who knows.
    * @method fetch
    * @param args {Object}
    */
    fetch: function(args) {
      var self = this;
      // var date = new Date();
      this.trigger('loadModelStarted');
      $.when(this.elder('fetch', args)).done(function(ev){
        self.trigger('loadModelCompleted', ev);
        // var dateComplete = new Date()
        // console.log('completed in '+(dateComplete - date));
      }).fail(function(ev) {
        self.trigger('loadModelFailed', ev);
      })
    },
    /**
    * Changes the attribute used as Id
    * @method setIdAttribute
    * @param attr {String}
    */
    setIdAttribute: function(attr) {
      this.idAttribute = attr;
    }
  });
})();
