(function() {

  /** 
   * Base View for all CartoDB views.
   * DO NOT USE Backbone.View directly
   */
  var View = cdb.core.View = Backbone.View.extend({
    constructor: function(options) {
      this._models = [];
      this._subviews = {};
      Backbone.View.call(this, options);
      View.viewCount++;
      View.views[this.cid] = this;
      this._created_at = new Date();
      cdb.core.Profiler.new_value('total_views', View.viewCount);
    },

    add_related_model: function(m) {
      this._models.push(m);
    },

    addView: function(v) {
      this._subviews[v.cid] = v;
      v._parent = this;
    },

    removeView: function(v) {
      delete this._subviews[v.cid];
    },

    clearSubViews: function() {
      _(this._subviews).each(function(v) {
        v.clean();
      });
      this._subviews = {};
    },

    /**
     * this methid clean removes the view
     * and clean and events associated. call it when 
     * the view is not going to be used anymore
     */
    clean: function() {
      var self = this;
      this.trigger('clean');
      this.clearSubViews();
      // remove from parent
      if(this._parent) {
        this._parent.removeView(this);
      }
      this.remove();
      this.unbind();
      // remove model binding
      _(this._models).each(function(m) {
        m.unbind(null, null, self);
      });
      this._models = [];
      View.viewCount--;
      delete View.views[this.cid];
    },

    /**
     * utility methods
     */

    getTemplate: function(tmpl) {
      if(this.options.template) {
        return  _.template(this.options.template);
      }
      return cdb.templates.getTemplate(tmpl);
    },

    show: function() {
        this.$el.show();
    },

    hide: function() {
        this.$el.hide();
    }

  }, {
    viewCount: 0,
    views: {}
  });

})();
