
/**
 * contains and manages the state for an slide
 */
cdb.admin.Slide = cdb.core.Model.extend({


  initialize: function() {
    this.visualization = new cdb.admin.Visualization();
    var self = this;
    this.bind('change:active', function _active() {
      if (this.visualization.isNew()) {
        this.visualization.set({ id: this.get('visualization_id') }).fetch();
        this.unbind('change:active', _active);
      }
    });
  },

  validate: function(attrs) {
    if (!attrs.visualization_id) {
      //throw new Error("missing visualization_id");
      return false;
    }
  },

  _trackCollection: function(src, dst) {

    function cloneModel(m) {
      if (m.clone) {
        return m.clone();
      }
      var a = _.clone(m.attributes);
      delete a.id;
      return a;
    }

    function _trackModel(model) {
      var m = dst.add(cloneModel(model));
      generic = new cdb.admin.Slide.Generic(m, _.omit(_.keys(m.attributes), 'id'));
      generic.track(model, this);
      model.bind('destroy', function d() {
        model.unbind('destroy', d);
        m.destroy();
      });
    }

    src.each(_trackModel);
    src.bind('add', _trackModel);
    // destroy managed
  },

  // track object state using restore and serialize
  _trackObject: function(obj, properties, restore, serialize) {

    // copy current state
    serialize.call(this, obj, _.pick(obj.attributes, properties));

    // change state when slide changes
    this.bind('change:active', function() {
      if (this.isActive()) {
        restore.call(this, obj, properties);
      }
    });

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
    }, this);

  },

  setMaster: function(vis) {
    var self = this;

    this.master = vis;

    // visualization
    var generic = new cdb.admin.Slide.Generic(this.visualization, ['description']);
    generic.track(vis, this);

    // map
    var map = this.visualization.map;
    generic = new cdb.admin.Slide.Generic(map, ['center', 'zoom']);
    generic.track(vis.map, this);

    this.master.map.layers.bind('change', function(layer) {
      // check if its already tracked
      if (map.layers.where({ parent_id: layer.id }).length === 0) {
        // create one and track
        var newLayer = layer.clone();
        newLayer.set('parent_id', layer.id);
        map.layers.add(newLayer);
        newLayer.save();
        this._bindLayer(layer, newLayer);
      }
    }, this);

    this.master.map.layers.bind('destroy', function(layer) {
      var tracked = map.layers.where({ parent_id: layer.id });
      if (tracked.length !== 0) {
        tracked[0].destroy();
      }
    });

    // look for tracked ones
    map.layers.bind('reset', function() {
      map.layers.each(function(lyr) {
        var tracked = self.master.map.layers.get(lyr.get('parent_id'));
        if (tracked) {
          self._bindLayer(tracked, lyr);
        }
      });
    }, this);
  },

  // track sql, cartocss
  _bindLayer: function(layer, clonedLayer) {
    var layerType = layer.get('type');

    var layers = this.visualization.map.layers;

    if (layerType.toLowerCase() === 'cartodb') {
      var tracker = new cdb.admin.Slide.Layers.CartoDB(clonedLayer);
      tracker.track(layer, this);
    }
  },

  isActive: function() {
    return !!this.get('active');
  }

});


cdb.admin.Slide.Generic = function(obj, properties) {
  this.restore = this.restore.bind(this);
  this.serialize = this.serialize.bind(this);
  this.model = obj;
  this.properties = properties;
};

_.extend(cdb.admin.Slide.Generic.prototype, {

  track: function(obj, slide) {
    slide._trackObject(obj, this.properties, this.restore(), this.serialize());
  },

  restore: function(o) {
    var self = this;
    return function(obj, properties) { 
      obj.set(
        properties ? _.pick(self.model.attributes, properties): _.omit(self.model.attributes, 'id')
      );
    };
  },

  serialize: function() {
    var self = this;
    return function(obj, attrs) { 
      if (self.model.isNew()) {
        self.model.set(attrs);
      } else {
        var props = this.properties ? this.properties: attrs;
        if (!_.isEqual(_.pick(self.model.attributes, props), attrs)) {
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
    this.bind('reset', function() { this.each(_setMaster); }, this);
  },

  create: function(done) {
    var self = this;
    return this.visualization.copy({ copy_layers: false, copy_overlays: false }, {
      success: function(vis) {
        var slide = new cdb.admin.Slide({ visualization_id: vis.id });
        slide.visualization = vis;
        self.add(slide);
        done && done(slide);
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
    slide.set('active', true);
  }



});
