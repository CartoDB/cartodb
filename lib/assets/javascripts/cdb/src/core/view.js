(function() {

  /**
   * Base View for all CartoDB views.
   * DO NOT USE Backbone.View directly
   */
  var View = cdb.core.View = Backbone.View.extend({
    classLabel: 'cdb.core.View',
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
      if(!m) throw "added non valid model"
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
        this._parent = null;
      }
      this.remove();
      this.unbind();
      // remove this model binding
      if (this.model && this.model.unbind) this.model.unbind(null, null, this); 
      // remove model binding
      _(this._models).each(function(m) {
        m.unbind(null, null, self);
      });
      this._models = [];
      View.viewCount--;
      delete View.views[this.cid];
      return this;
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
    },

    /**
    * Listen for an event on another object and triggers on itself, with the same name or a new one
    * @method retrigger
    * @param ev {String} event who triggers the action
    * @param obj {Object} object where the event happens
    * @param obj {Object} [optional] name of the retriggered event;
    */
    retrigger: function(ev, obj, retrigEvent) {
      if(!retrigEvent) {
        retrigEvent = ev;
      }
      var self = this;
      obj.bind && obj.bind(ev, function() {
        self.trigger(retrigEvent);
      }, self)
      // add it as related model//object
      this.add_related_model(obj);
    },
    /**
    * Captures an event and prevents the default behaviour and stops it from bubbling
    * @method killEvent
    * @param event {Event}
    */
    killEvent: function(ev) {
      if(ev && ev.preventDefault) {
        ev.preventDefault();
      };
      if(ev && ev.stopPropagation) {
        ev.stopPropagation();
      };
    },

    /**
    * Remove all the tipsy tooltips from the document
    * @method cleanTooltips
    */
    cleanTooltips: function() {
      this.$('.tipsy').remove();
    }




  }, {
    viewCount: 0,
    views: {},

    /**
     * when a view with events is inherit and you want to add more events
     * this helper can be used:
     * var MyView = new core.View({
     *  events: cdb.core.View.extendEvents({
     *      'click': 'fn'
     *  })
     * });
     */
    extendEvents: function(newEvents) {
      return function() {
        return _.extend(newEvents, this.constructor.__super__.events);
      };
    },

    /**
     * search for views in a view and check if they are added as subviews
     */
    runChecker: function() {
      _.each(cdb.core.View.views, function(view) {
        _.each(view, function(prop, k) {
          if( k !== '_parent' &&
              view.hasOwnProperty(k) &&
              prop instanceof cdb.core.View &&
              view._subviews[prop.cid] === undefined) {
            console.log("=========");
            console.log("untracked view: ");
            console.log(prop.el);
            console.log('parent');
            console.log(view.el);
            console.log(" ");
          }
        });
      });
    }
  });

})();
