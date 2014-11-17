
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
        //self.master.map.set(this.visualization.map.attributes, { silent: true });
        self.master.changeTo(this.visualization);
        //self.master.map.set(this.visualization.map.attributes);
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
      this.visualization = new cdb.admin.Visualization({ id: this.get('id'), bindMap: false});
      this.visualization.fetch();
      this._bindMaster();
    }

  },

  _bindMaster: function() {

    // visualization
    var generic = new cdb.admin.Slide.Generic(this.visualization, null, {
      debug_name: 'vis'
    });
    generic.track(this.master, this);

    // map
    /*var map = this.visualization.map;
    generic = new cdb.admin.Slide.Generic(map, null, {
      debug_name: 'map'
    });
    generic.track(this.master.map, this);
    */
  },

  isActive: function() {
    return !!this.get('active');
  },

  destroy: function() {
    this.visualization.destroy.apply(this.visualization, arguments);
    return cdb.core.Model.prototype.destroy.apply(this, arguments);
  }

});


/**
 * tracks all the properties for an object
 */
cdb.admin.Slide.Generic = function(obj, properties, options) {
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
    slide._trackObject(obj, this.properties, ser);
  },

  serialize: function() {
    var self = this;
    return function(obj, attrs) {
      // don't serialize if the attributes are exactly the same
      if (!_.isEqual(obj.attributes, self.model.attributes)) {
        if (self.options.debug_name) {
          cdb.log.debug("SERIALIZE " + self.options.debug_name);
        }
        self.model.set(_.omit(attrs, 'id', 'parent_id'));
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
