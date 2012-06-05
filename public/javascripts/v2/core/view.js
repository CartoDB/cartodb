(function() {

  /** 
   * Base View for all CartoDB views.
   * DO NOT USE Backbone.View directly
   */
  var View = cdb.core.View = Backbone.View.extend({
    constructor: function(options) {
      Backbone.View.call(this, options);
      View.viewCount++;
      View.views[this.cid] = this;
      this._created_at = new Date();
    },

    /**
     * this methid clean removes the view
     * and clean and events associated. call it when 
     * the view is not going to be used anymore
     */
    clean: function() {
      this.remove();
      this.unbind();
      View.viewCount--;
      delete View.views[this.cid];
    }

  }, {
    viewCount: 0,
    views: {}
  });

})();
