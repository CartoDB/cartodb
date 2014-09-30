
/**
 * contains and manages the state for an slide
 */
cdb.admin.Slide = cdb.core.Model.extend({

  initialize: function() {
    var self = this;
    this._tracked = []; 
    this.visualization = null;
    this.bind('change:active', function _active() {
      if (self.isActive() && self.master && !self.visualization) {
        self.setMaster(self.master);
      } else {
        //this.unload();
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
    this.master.map.layers.unbind(null, null, this);
    this.master.overlays.unbind(null, null, this);
    this.master.unbind(null, null, this);
    _.each(this._tracked, function(o) {
      o.unbind(null, null, self);
    });
    this._tracked = [];
    this.loaded = false;
  },

  // track object state using restore and serialize
  _trackObject: function(obj, properties, restore, serialize) {

    this._tracked.push(obj);
    // copy current state
    //serialize.call(this, obj, _.pick(obj.attributes, properties));

    // change state when slide changes
    this.bind('change:active', function() {
      if (this.isActive()) {
        restore.call(this, obj, properties);
      }
    }, this);

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

    obj.bind('destroy', function() {
      obj.unbind(listen + " destroy", null, this);
      this._tracked.splice(this._tracked.indexOf(obj), 1);
    }, this);

  },

  setMaster: function(vis) {
    var self = this;
    this.master = vis;

    if (!this.visualization) {
      this.visualization = new cdb.admin.Visualization({ id: this.get('id') });
      this.visualization.enableOverlays();
      this.visualization.fetch({
        success: function() {
          self.visualization.map.layers.bind('reset', function _done() {
            self.visualization.map.layers.unbind('reset', _done);
            self.loaded = true;
            self._bindMaster();
          })
        }
      });
    } else {
      this._bindMaster();
    }
    this.visualization.bind('destroy', function() {
      this.trigger('destroy', this);
    }, this);

  },

  _bindMaster: function() {

    // visualization
    var generic = new cdb.admin.Slide.Generic(this.visualization, ['description'], {
      debug_name: 'vis'
    });
    generic.track(this.master, this);

    // map
    var map = this.visualization.map;
    generic = new cdb.admin.Slide.Generic(map, ['center', 'zoom'], {
      debug_name: 'map',
      debounce_serialize: 1000
    });
    generic.track(this.master.map, this);

    this._trackLayers();
    this._trackOverlays();

  },

  _trackOverlays: function() {
    var overlays = this.master.overlays;

    overlays.bind('change', function(overlay) {
      if (!this.isActive()) return;
      if (this.visualization.overlays.where({ parent_id: overlay.id }).length === 0) {
        // create one and track
        var newOverlay = overlay.clone();
        newOverlay.set('parent_id', overlay.id);
        this.visualization.overlays.add(newOverlay);
        newOverlay.save();
        var generic = new cdb.admin.Slide.Generic(newOverlay);
        generic.track(overlay, this);
      }
    }, this);

    overlays.bind('destroy', function(overlay) {
      if (!this.isActive()) return;
      var tracked = this.visualization.overlays.where({ parent_id: overlay.id });
      if (tracked.length !== 0) {
        tracked[0].destroy();
      }
    }, this);

    this.visualization.overlays.bind('reset', function() {
      if (!this.isActive()) return;
      this.visualization.overlays.each(function(overlay) {
        var tracked = overlays.get(lyr.get('parent_id'));
        if (tracked) {
          var generic = new cdb.admin.Slide.Generic(overlay);
          generic.track(tracked, this);
        }
      });
    }, this);

    this.bind('change:active', function() {
      var self = this;
      if (this.isActive() && this.visualization) {
        var o = this.visualization.overlays;
        // TODO: delete all
        this.master.overlays.reset([]);
        var newOverlays = o.map(function(overlay) {
          var c = overlay.clone();
          self.master.overlays.add(c);
          c.save();
          c.bind('change:id', function _track() {
            c.unbind('change:id', _track);
            overlay.set('parent_id', c.id);
            var generic = new cdb.admin.Slide.Generic(overlay);
            generic.track(c, self);
          });
        });
      }
    }, this);

  },

  _trackLayers: function() {
    var self = this;
    var map = this.visualization.map;

    function cloneLayer(layer) {
        var newLayer = layer.clone();
        newLayer.set('parent_id', layer.id);
        map.layers.add(newLayer);
        newLayer.save();
        self._bindLayer(layer, newLayer);
    }

    this.master.map.layers.bind('add change', function(layer) {
      if (!this.isActive()) return;
      // check if its already tracked
      if (map.layers.where({ parent_id: layer.id }).length === 0) {
        // create one and track
        cloneLayer(layer);
      }
    }, this);

    this.master.map.layers.bind('reset', function() {
      map.layers.each(function(l) { l.destroy(); });
      this.master.map.layers(cloneLayer);
    }, this);

    this.master.map.layers.bind('destroy remove', function(layer) {
      // in this case we need to track layers removed
      // if (!this.isActive()) return;
      var tracked = map.layers.where({ parent_id: layer.id });
      if (tracked.length !== 0) {
        tracked[0].destroy();
        tracked[0].unbind();
      }
    }, this);


    function trackLayerList() {
      map.layers.each(function(lyr) {
        var tracked = self.master.map.layers.get(lyr.get('parent_id'));
        if (tracked) {
          self._bindLayer(tracked, lyr);
        } else {
          cdb.log.error("untracked layer");
        }
      });
    }

    // look for tracked ones
    map.layers.bind('reset', trackLayerList, this);
    trackLayerList();
  },

  // track sql, cartocss
  _bindLayer: function(layer, clonedLayer) {
    var layerType = layer.get('type');

    if (layerType.toLowerCase() === 'cartodb' || layerType.toLowerCase() === 'torque') {
      var tracker = new cdb.admin.Slide.Layers.CartoDB(clonedLayer);
      tracker.track(layer, this);
    } else {
      var generic = new cdb.admin.Slide.Generic(clonedLayer);
      generic.track(layer, this);
    }
  },

  isActive: function() {
    return !!this.get('active');
  },

  destroy: function() {
    return this.visualization.destroy.apply(this.visualization, arguments);
  }

});


/**
 * tracks all the properties for an object
 */
cdb.admin.Slide.Generic = function(obj, properties, options) {
  this.restore = this.restore.bind(this);
  this.serialize = this.serialize.bind(this);
  this.model = obj;
  this.properties = properties;
  this.options = options || {};
};

_.extend(cdb.admin.Slide.Generic.prototype, {

  track: function(obj, slide) {
    var ser = this.serialize();
    if (this.options.debounce_serialize) {
      ser = _.debounce(ser, this.options.debounce_serialize);
    }
    slide._trackObject(obj, this.properties, this.restore(), ser);
  },

  restore: function(o) {
    var self = this;
    return function(obj, properties) { 
      if (self.options.debug_name) {
        cdb.log.debug("RESTORE " + self.options.debug_name);
      }
      if (self.options.clear_on_restore) {
        obj.clear({ silent: true });
      }
      var p = properties ? _.pick(self.model.attributes, properties): _.omit(self.model.attributes, 'id', 'parent_id');
      if (_.keys(p).length > 0) {
        obj.set(p);
      }
    };
  },

  serialize: function() {
    var self = this;
    return function(obj, attrs) {
      // don't serialize if the attributes are exactly the same
      if (!_.isEqual(obj.attributes, self.model.attributes)) {
        if (self.options.debug_name) {
          cdb.log.debug("SERIALIZE " + self.options.debug_name);
        }
        if (self.model.isNew()) {
          self.model.set(_.omit(attrs, 'id', 'parent_id'));
        } else {
          self.model.save(attrs);
        }
      }
    };
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

  create: function(done) {
    var self = this;
    return this.visualization.copy({
      copy_overlays: false,
      type: 'slide',
      parent_id: this.visualization.id
    }, {
      success: function(vis) {
        vis.map.layers.bind('reset', function() {
          // on create assign the track id
          var slide = new cdb.admin.Slide({ id: vis.id });
          slide.visualization = vis;
          self.add(slide);
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
