
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

  getObjState: function(obj) {
    return this.get(obj.id);
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
    console.log("listen", listen);
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

    // visualization
    var generic = new cdb.admin.Slide.Generic(this.visualization, ['description']);
    generic.track(vis, this);

    // map
    var map = this.visualization.map;
    generic = new cdb.admin.Slide.Generic(map, ['center', 'zoom']);
    generic.track(vis.map, this);

    // create layers
    if (0 === this.visualization.map.layers.size()) {
      //vis.map.layers.clone(this.visualization.map.layers);
      this.visualization.map.layers.bind('reset', function _reset() {
        vis.map.layers.each(this._bindLayer.bind(this));
        this.visualization.map.layers.unbind('reset', _reset, this);
      }, this);
    } else {
      // layers
      vis.map.layers.each(this._bindLayer.bind(this));
    }


    //TODO: track layer add/remove

  },

  // track sql, cartocss
  _bindLayer: function(layer) {
    var layerType = layer.get('type');
    var layerIndex = layer.collection.indexOf(layer);

    var layers = this.visualization.map.layers;
    if (layerIndex >= layers.length) {
      throw new Error("slide map layers should be created before track");
    }

    if (layerType.toLowerCase() === 'cartodb') {
      var tracker = new cdb.admin.Slide.Layers.CartoDB(layers.at(layerIndex));
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

cdb.admin.Slide.Layers = {};

cdb.admin.Slide.Layers.CartoDB = function(layer) {
   this.layer = layer;
   this.LAYER_TRACKED_PROPERTIES = ['tile_style', 'query', 'visible', 'filters', 'tile_style_custom'];
}

_.extend(cdb.admin.Slide.Layers.CartoDB.prototype, {

  track: function(layer, slide) {

    slide._trackObject(layer, this.LAYER_TRACKED_PROPERTIES,
      this._restoreLayer.bind(this),
      this._serializeLayer.bind(this)
    );

    var self = this;
    _.each(['wizard_properties', 'legend', 'infowindow'], function(subModel) {
      var generic = new cdb.admin.Slide.Generic(self.layer[subModel]);
      generic.track(layer[subModel], slide);
    })

  },

  // get all the data needed for layer
  _serializeLayer: function(layer) {
    var attrs = _.pick(layer.attributes, this.LAYER_TRACKED_PROPERTIES);
    var s = {};
    for (var attr in attrs) {
      val = attrs[attr];
      if (!_.isEqual(this.layer.get(attr), val)) {
        s[attr] = val;
      }
    }
    if (_.size(s)) {
      this.layer.save(s);
    }
  },

  _restoreLayer: function(layer) {
    var attrs = _.pick(this.layer.attributes, this.LAYER_TRACKED_PROPERTIES);

    // when filters are present don't apply sql query
    // it will be generated by filters
    var applyQuery = null;
    if (attrs.filter) {
      delete attrs.query;
    }

    if (attrs.query) {
      applyQuery = attrs.query;
    }

    // don't change query directly, use applySQLView
    delete attrs.query;

    if (applyQuery) {
      layer.applySQLView(applyQuery);
    } else {
      layer.clearSQLView();
    }

    var s = {};
    for (var attr in attrs) {
      val = attrs[attr];
      // If the new and current value differ, record the change.
      if (!_.isEqual(layer.get(attr), val)) {
        s[attr] = val;
      }
    }
    if (_.size(s)) {
      layer.set(s);
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

    var self = this;
    var _setMaster = function(m) { 
      m.setMaster(self.visualization);
    };
    this.bind('add', _setMaster, this);
    this.bind('reset', function() { this.each(_setMaster); }, this);
  },

  create: function(done) {
    var self = this;
    return this.visualization.copy(null, {
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
