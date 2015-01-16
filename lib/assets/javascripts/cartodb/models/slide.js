cdb.admin.SlideTransition = cdb.core.Model.extend({
  defaults: {
    time: 0
  }
});

/**
 * contains and manages the state for an slide
 */
cdb.admin.Slide = cdb.core.Model.extend({

  initialize: function() {
    var self = this;
    this._tracked = []; 
    this.visualization = null;
    this.bind('change:active', function _active() {
      if (self.isActive() && self.master && self.visualization) {
        self.master.changeTo(this.visualization);
      }
    });
  },

  // unload the visualization from memory and deattach all the stuff
  unload: function() {
    var self = this;
    this.unbind(null, null, this);
    this.visualization.unbind(null, null, this);
    this.visualization = null;
    this.master.map.unbind(null, null, this);
    this.master.unbind(null, null, this);
    _.each(this._tracked, function(o) {
      o.unbind(null, null, self);
    });
    this._tracked = [];
    this.loaded = false;
  },

  // track object state using restore and serialize
  _trackObject: function(obj, properties, serialize) {

    this._tracked.push(obj);

    // build list of properties to listen
    var listen = 'change';
    if (properties && properties.length) {
      listen = properties.map(function(p) {
        return 'change:' + p;
      }).join(' ');
    }

    // serialize object state to slide
    obj.bind(listen, function() {
      if (this.isActive()) {
        serialize.call(this, obj, properties ? _.pick(obj.attributes, properties): obj.attributes);
      }
    }, this);

  },

  setMaster: function(vis) {
    var self = this;
    this.master = vis;
    if (!this.visualization) {
      this.visualization = new cdb.admin.Visualization(
      _.extend(
        _.pick(this.attributes, 'id', 'map_id', 'next_id', 'prev_id', 'transition_options', 'type'), { bindMap: false, parent_id: vis.id }
      ));
    }
  },

  isActive: function() {
    return !!this.get('active');
  },

  destroy: function() {
    this.visualization.destroy.apply(this.visualization, arguments);
    this.trigger('destroy', this, this.collection);
    return this;
  }, 

  setNext: function(next_visualization_id, opt) {
    var v = new cdb.admin.Visualization({ id: this.id });
    v.order.save('next_id', next_visualization_id, opt);
    this._reorder(next_visualization_id);
    this.trigger('change:next_id', this, next_visualization_id);
    return this;
  },

  _reorder: function(next_visualization_id) {
    var s, insertIndex;
    // look for the slide in collection
    if (this.collection) {
      var col = this.collection;
      if (next_visualization_id !== null) {
        s = col.get(next_visualization_id);
        insertIndex = col.indexOf(s);
      } else {
        insertIndex = col.length;
      }
      if (insertIndex >= 0) {
        var currentIndex = col.indexOf(this);
        // insert just before the
        col.models.splice(insertIndex, 0, this);
        if (currentIndex >= insertIndex) currentIndex += 1;
        // remove previous one
        col.models.splice(currentIndex, 1);
      }
    }

  }

});


/**
 * slide collection
 */
cdb.admin.Slides = Backbone.Collection.extend({

  model: cdb.admin.Slide,

  initialize: function(models, options) {
    if (!options || !options.visualization) {
      throw new Error("visualization is undefined");
    }

    // master visualization
    this.visualization = options.visualization;
    // save the master visualization id so when a new visualization is created
    // we set this as parent, see create method
    this.master_visualization_id = this.visualization.id;


    var self = this;

    var _setMaster = function(m) { 
      m.setMaster(self.visualization);
    };

    this.bind('add', _setMaster, this);
    this.bind('add', function(slide) {
      this.setActive(slide);
    }, this);

    this.bind('reset', function() { 
      this.each(_setMaster);
      this.setActive(this.at(0));
    }, this);

    this.bind('remove', this._onRemoveSlide, this);
  },

  _onRemoveSlide: function(slide, collection, options) {
    if (slide.isActive() && this.length > 0) {
      if (options.index !== this.length) {
        this.setActive(this.at(options.index));
      } else if (options.index == this.length)  {
        this.setActive(this.at(options.index - 1));
      }
    }
  },

  // https://github.com/jashkenas/backbone/issues/962
  initializeModels: function() {
    var self = this;
    var _setMaster = function(m) {
      m.setMaster(self.visualization);
    };
    this.each(_setMaster);
  },

  // creates a new slide
  // there is an special case when there is no slides: two slides are actually created, one to clone the master one and the new one the user is actually adding
  create: function(done) {
    var self = this;
    if (this.length === 0) {
      this._createSlide(function(slide) {
        self._createSlide(function(slide2) {
          self.add(slide)
          self.add(slide2);
          done && done(slide2);
        }, { no_add: true, prev_id: slide.id });
      }, { no_add: true });
    } else {
      this._createSlide(done);
    }
  },

  _createSlide: function(done, options) {
    options = options || {}
    var self = this;
    var prev_id = options.prev_id || null;
    if (!prev_id && this.length) {
      prev_id = this.last().visualization.id
    }
    return this.visualization.copy({
      copy_overlays: true,
      type: 'slide',
      parent_id: this.master_visualization_id,
      prev_id: prev_id
    }, {
      success: function(vis) {
        vis.map.layers.bind('reset', function() {
          // on create assign the track id
          var slide = new cdb.admin.Slide({ id: vis.id });
          slide.visualization = vis;
          if (!options.no_add) self.add(slide);
          done && done(slide);
        });
      }
    });
  },

  setActive: function(slide) {
    var active = this.find(function (s) {
      return s.get('active');
    });
    if (active) {
      active.set('active', false);
    }
    if (slide) slide.set('active', true);
  },

  /*
   * return true if some layer inside any of the visualization contain a torque layer
   */
  existsTorqueLayer: function() {
    return this.any(function(s) {
      return s.visualization.map.layers.getTorqueLayers().length !== 0;
    });
  }

});
