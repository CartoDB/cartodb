
/*
 * extend infowindow to serialize only the data we need
 */
_.extend(cdb.geo.ui.InfowindowModel.prototype, {
  toJSON: function() {
    var fields = [];

    if (!this.attributes.disabled) {
      fields = _.clone(this.attributes.fields);
    }

    return {
      fields:             fields,
      template_name:      this.attributes.template_name,
      template:           this.attributes.template,
      alternative_names:  this.attributes.alternative_names,
      old_fields:         this.attributes.old_fields,
      old_template_name:  this.attributes.old_template_name,
      width:              this.attributes.width,
      maxHeight:          this.attributes.maxHeight
    };
  },

  removeMissingFields: function(columns) {
    var columnsSet = {}
    for(var i = 0; i < columns.length; ++i) {
      var c = columns[i];
      columnsSet[c] = true;
    }
    var fields = this.get('fields');
    if (!fields) {
      return;
    }
    for(var i = 0; i < fields.length; ++i) {
      var name = fields[i].name;
      if (! (name in columnsSet)) {
        this.removeField(name);
      }
    }
  },

  addMissingFields: function(columns) {
    var fieldsSet = {};
    var fields = this.get('fields');

    for(var i = 0; i < fields.length; ++i) {
      var c = fields[i].name;
      fieldsSet[c] = true;
    }

    for(var i = 0; i < columns.length; ++i) {
      var name = columns[i];
      if (! (name in fieldsSet)) {
        this.addField(name);
      }
    }
  },

  mergeFields: function(columns) {
    // remove fields that no longer exist
    this.removeMissingFields(columns);
    // add new fields that exists
    this.addMissingFields(columns);
  },

  // return the list of columns involved in the infowindow
  // ready to set interactivity in a cartodb layer
  getInteractivity: function() {
    var fields = this.get('fields') || [];
    var columns = [];
    for(var i = 0; i < fields.length; ++i) {
      columns.push(fields[i].name);
    }
    return columns;
  }
});

/**
 * extend gmaps layer for data serialization
 */
cdb.admin.GMapsBaseLayer = cdb.geo.GMapsBaseLayer.extend({

  clone: function() {
    return new cdb.admin.GMapsBaseLayer(_.clone(this.attributes));
  },

  parse: function(data) {
    var c = {};
    _.extend(c, data.options, {
      id: data.id,
      type: 'GMapsBase',
      order: data.order,
      parent_id: data.parent_id
    });
    return c;
  },

  toJSON: function() {
    var c = _.clone(this.attributes);

    var d = {
      kind:  'gmapsbase',
      options: c,
      order: c.order
    };

    if(c.id !== undefined) {
      d.id = c.id;
    }
    return d;
  }
});

/**
 * extend wms layer for data serialization
 */
cdb.admin.WMSLayer = cdb.geo.WMSLayer.extend({

  clone: function() {
    return new cdb.admin.WMSLayer(_.clone(this.attributes));
  },

  /*
  * Create className from the urlTemplate of the basemap
  */
  _generateClassName: function(urlTemplate) {
    if (urlTemplate) {
      var className = urlTemplate;

      if (className && parseInt(className) && _.isNumber(parseInt(className))) {
        className = "w" + className;
      }

      return className.replace(/\s+/g, '').replace(/[^a-zA-Z_0-9 ]/g, "").toLowerCase();

    } else return "";
  },

  parse: function(data) {

    var self = this;
    var c = {};

    _.extend(c, data.options, {
      id: data.id,
      className: self._generateClassName(data.options.layers),
      type: 'WMS',
      order: data.order,
      parent_id: data.parent_id
    });

    return c;
  },

  toJSON: function() {
    var c = _.clone(this.attributes);

    var d = {
      kind:  'wms',
      options: c,
      order: c.order
    };

    if(c.id !== undefined) {
      d.id = c.id;
    }
    return d;
  }

});

/**
 * extend plain layer for data serialization
 */
cdb.admin.PlainLayer = cdb.geo.PlainLayer.extend({

  parse: function(data) {
    var c = {};
    _.extend(c, data.options, {
      id: data.id,
      type: 'Plain',
      order: data.order,
      parent_id: data.parent_id
    });
    return c;
  },

  toJSON: function() {
    var c = _.clone(this.attributes);

    var d = {
      kind:  'background',
      options: c,
      order: c.order
    };

    if(c.id !== undefined) {
      d.id = c.id;
    }
    return d;
  }
});

/**
 * extend tiled layer to adapt serialization
 */
cdb.admin.TileLayer = cdb.geo.TileLayer.extend({

  clone: function() {
    return new cdb.admin.TileLayer(_.clone(this.attributes));
  },

  /*
  * Create className from the urlTemplate of the basemap
  */
  _generateClassName: function(urlTemplate) {
    if (urlTemplate) {
      return urlTemplate.replace(/\s+/g, '').replace(/[^a-zA-Z_0-9 ]/g, "").toLowerCase();
    } else return "";
  },

  parse: function(data) {
    var self = this;
    var c = {};

    _.extend(c, data.options, {
      id: data.id,
      className: self._generateClassName(data.options.urlTemplate),
      type: 'Tiled',
      order: data.order,
      parent_id: data.parent_id
    });

    return c;
  },

  toJSON: function() {
    var c = _.clone(this.attributes);

    var d = {
      kind:  'tiled',
      options: c,
      order: c.order
    };

    if(c.id !== undefined) {
      d.id = c.id;
    }
    return d;
  },

  /**
   * validateTemplateURL - Validates current urlTemplate of layer.
   *
   * @param {Object} callbacks with success and error functions defined to be called depending on validation outcome.
   */
  validateTemplateURL: function(callbacks) {
    var subdomains = ['a', 'b', 'c'];
    var image = new Image();
    image.onload = callbacks.success;
    image.onerror = callbacks.error;
    image.src = this.get('urlTemplate').replace(/\{s\}/g, function() {
      return subdomains[Math.floor(Math.random() * 3)];
    })
      .replace(/\{x\}/g, '0')
      .replace(/\{y\}/g, '0')
      .replace(/\{z\}/g, '0');
  }

}, {

  /**
   * @param {String} url
   * @param {Boolean} tms
   * @return {cdb.admin.TileLayer}
   */
  byCustomURL: function(url, tms) {
    // Minimal test for "valid URL" w/o having to complicate it with regex
    if (url && url.indexOf('/') === -1) throw new TypeError('invalid URL');

    // Only lowercase the placeholder variables, since the URL may contain case-sensitive data (e.g. API keys and such)
    url = url.replace(/\{S\}/g, "{s}")
      .replace(/\{X\}/g, "{x}")
      .replace(/\{Y\}/g, "{y}")
      .replace(/\{Z\}/g, "{z}");

    var layer = new cdb.admin.TileLayer({
      urlTemplate: url,
      attribution: null,
      maxZoom: 21,
      minZoom: 0,
      name: '',
      tms: tms
    });
    layer.set('className', layer._generateClassName(url));

    return layer;
  }
});

cdb.admin.TorqueLayer = cdb.admin.CartoDBLayer.extend({

  /*parse: function(data, options) {
    var c = cdb.admin.CartoDBLayer.prototype.parse.call(this, data, options);
    c.type = 'torque';
    return c;
  }*/

});

cdb.admin.Layers = cdb.geo.Layers.extend({

  _DATA_LAYERS: ['CartoDB', 'torque'],

  // the model class works here like a factory
  // depending on the kind of layer creates a
  // type of layer or other
  model: function(attrs, options) {
    var typeClass = {
      'Tiled': cdb.admin.TileLayer,
      'CartoDB': cdb.admin.CartoDBLayer,
      'Plain': cdb.admin.PlainLayer,
      'GMapsBase': cdb.admin.GMapsBaseLayer,
      'WMS': cdb.admin.WMSLayer,
      'torque': cdb.admin.CartoDBLayer
    };
    var typeMap = {
      'Layer::Tiled': 'Tiled',
      'Layer::Carto': 'CartoDB',
      'Layer::Background': 'Plain',
      'tiled': 'Tiled',
      'carto': 'CartoDB',
      'wms': 'WMS',
      'background': 'Plain',
      'gmapsbase': 'GMapsBase',
      'torque': 'torque'
    };

    return new typeClass[typeMap[attrs.kind]](attrs, options);
  },

  initialize: function() {
    this.bind('change:order', function() {
      if (!this._isSorted()) this.sort();
    });
    cdb.geo.Layers.prototype.initialize.call(this);
  },

  add: function(models, options) {
    return Backbone.Collection.prototype.add.apply(this, arguments);
  },

  getTorqueLayers: function() {
    return this.where({ type: 'torque' });
  },

  getTiledLayers: function() {
    return this.where({ type: 'Tiled' });
  },

  // given layer model returns the index inside the layer definition
  getLayerDefIndex: function(layer) {
    var cartodbLayers = this.getLayersByType('CartoDB');
    if(!cartodbLayers.length) return -1;
    for(var i = 0, c = 0; i < cartodbLayers.length; ++i) {
      if(cartodbLayers[i].get('visible')) {
        if(cartodbLayers[i].cid === layer.cid) {
          return c;
        }
        ++c;
      }
    }
    return -1;
  },

  getLayerDef: function() {
    var cartodbLayers = this.getLayersByType('CartoDB');
    var layerDef = {
      version:'1.0.1',
      layers: []
    };

    for(var i = 0; i < cartodbLayers.length; ++i) {
      if(cartodbLayers[i].get('visible')) {
        layerDef.layers.push(cartodbLayers[i].getLayerDef());
      }
    }
    return layerDef;
  },

  /** return non-base layers */
  getDataLayers: function() {
    var self = this;
    return this.filter(function(lyr) {
      return _.contains(self._DATA_LAYERS, lyr.get('type'));
    });
  },

  /** without non-base layers */
  getTotalDataLayers: function() {
    return this.getDataLayers().length;
  },

  /** without non-base layers */
  getTotalDataLegends: function() {
    var self = this;
    return this.filter(function(lyr) {
      return _.contains(self._DATA_LAYERS, lyr.get('type')) &&
            lyr.get('legend') &&
            lyr.get('legend').type &&
            lyr.get('legend').type.toLowerCase() !== "none";
    }).length;
  },

  getLayersByType: function(type) {
    if (!type || type === '' ) {
      cdb.log.info("a layer type is necessary to get layers");
      return 0;
    }

    return this.filter(function(lyr) {
      return lyr.get('type') === type;
    });
  },

  isLayerOnTopOfDataLayers: function(layer) {
    var dataLayerOnTop = this.getDataLayers().splice(-1)[0];
    return dataLayerOnTop.cid === layer.cid;
  },

  url: function(method) {
    var version = cdb.config.urlVersion('layer', method);
    return '/api/' + version + '/maps/' +  this.map.id + '/layers';
  },

  parse: function(data) {
    return data.layers;
  },

  saveLayers: function(opts) {
    opts = opts || {};
    this.save(null, opts);
  },

  save: function(attrs, opts) {
    Backbone.sync('update', this, opts);
  },

  toJSON: function(options) {
    // We can't use the default toJSON because it uses this.map(function(){...})
    // function within it but we override it using map containing all map stuff there.
    // And we have to send all layers data within a variable called layers.
    var array = _.map(this.models, function(model) {
      return model.toJSON(options);
    });

    return { layers: array }
  },

  clone: function(layers) {
    layers = layers || new cdb.admin.Layers();
    this.each(function(layer) {
      if(layer.clone) {
        var lyr = layer.clone();
        lyr.unset('id');
        layers.add(lyr);
      } else {
        var attrs = _.clone(layer.attributes);
        delete attrs.id;
        layers.add(attrs);
      }
    });
    return layers;
  },

  _isSorted: function() {
    var sorted = true;

    var layers = _(this.models).map(function(m) {
      return { cid: m.cid,  order: m.get('order')}
    });

    layers.sort(function(a, b) {
      return a.order - b.order;
    })

    return _.isEqual(
      _(layers).map(function(m) { return m.cid; }),
      _(this.models).map(function(m) { return m.cid; })
    )
  },

  moveLayer: function(movingLayer, options) {
    options = options || {};
    var newIndex = options.to;
    var layerAtNewIndex = this.at(newIndex);
    movingLayer.set('order', layerAtNewIndex.get('order'), { silent: true });

    // Remove and add the layer again at the new position
    this.remove(movingLayer, { silent: true });
    this.add(movingLayer, { at: newIndex, silent: true });

    // Update the order of all layers
    for (var i = 0; i < this.size(); i++) {
      var layer = this.at(i);
      layer.set('order', i);
    }

    this.trigger('reset');
    this.saveLayers({
      complete: options.complete,
      error: function() {
        throw 'Error saving layers after moving them'
      }
    });
  }
});

/**
 * this is a specialization of generic map prepared to hold two layers:
 *  - a base layer
 *  - a data layer which contains the table data
 *
 * cartodb only supports one data layer per map so this will change when
 * that changes
 */

cdb.admin.Map = cdb.geo.Map.extend({

  urlRoot: '/api/v1/maps',

  initialize: function() {
    this.constructor.__super__.initialize.apply(this);
    this.sync = Backbone.delayedSaveSync(Backbone.syncAbort, 500);
    this.bind('change:id', this._fetchLayers, this);

    this.layers = new cdb.admin.Layers();
    this.layers.map = this;
    this.layers.bind('reset add change', this._layersChanged, this);
    this.layers.bind('reset add remove change:attribution', this._updateAttributions, this);
  },

  saveLayers: function(opts) {
    opts = opts || {};
    var none = function() {}
    this.layers.saveLayers({
      success: opts.success || none,
      error: opts.error || none
    });
  },

  _layersChanged: function() {
    if(this.layers.size() >= 1) {
      this._adjustZoomtoLayer(this.layers.at(0));
      if(this.layers.size() >= 2) {
        this.set({ dataLayer: this.layers.at(1) });
      }
    }
  },

  // fetch related layers
  _fetchLayers: function() {
    this.layers.fetch();
  },

  /**
   * link to a table
   */
  relatedTo: function(table) {
    this.table = table;
    this.table.bind('change:map_id', this._fetchOrCreate, this);
  },

  parse: function(data) {
    data.bounding_box_ne = JSON.parse(data.bounding_box_ne);
    data.bounding_box_sw = JSON.parse(data.bounding_box_sw);
    data.view_bounds_ne = JSON.parse(data.view_bounds_ne);
    data.view_bounds_sw = JSON.parse(data.view_bounds_sw);
    data.center = JSON.parse(data.center);
    return data;
  },

  _fetchOrCreate: function() {
    var self = this;
    var map_id = this.table.get('map_id');
    if(!map_id) {
      this.create();
    } else {
      this.set({ id: map_id });
      this.fetch({
        error: function() {
          cdb.log.info("creating map for table");
          self.create();
        }
      });
    }
  },

  /**
   * change base layer and save all the layers to preserve the order
   */
  setBaseLayer: function(baseLayer) {
    this.trigger('savingLayers');

    // Check if the selected base layer is already selected
    if (this.isBaseLayerAdded(baseLayer)) {
      this.trigger('savingLayersFinish');
      return false;
    }

    var self = this;
    var newBaseLayer = baseLayer;
    var currentBaseLayer = this.layers.at(0);
    var newBaseLayerHasLabels = newBaseLayer.get('labels') && newBaseLayer.get('labels').urlTemplate;

    // Sets the base layer
    var options = {
      success: function() {
        if (!newBaseLayerHasLabels) {
          self.trigger('savingLayersFinish');
        }
      },
      error: function() {
        cdb.log.error("error changing the basemap");
        self.trigger('savingLayersFinish');
      }
    }

    if (currentBaseLayer) {
      if (currentBaseLayer.get('type') === newBaseLayer.get('type')) {
        this._updateBaseLayer(currentBaseLayer, newBaseLayer, options);
      } else {
        this._replaceBaseLayer(currentBaseLayer, newBaseLayer, options);
      }
    } else {
      this._addBaseLayer(newBaseLayer, options);
    }


    // Adds/updates/removes layer with labels at the top
    options.success = function() {
      self.trigger('savingLayersFinish');
    }

    if (newBaseLayerHasLabels) {
      if (this._hasLabelsLayer()) {
        this._updateLabelsLayer(newBaseLayer, options);
      } else {
        this._addLabelsLayer(newBaseLayer, options);
      }
    } else {
      if (this._hasLabelsLayer()) {
        this._destroyLabelsLayer(options);
      }
    }

    return newBaseLayer;
  },

  _updateBaseLayer: function(currentBaseLayer, newBaseLayer, opts) {
    var newAttributes = _.extend(_.clone(newBaseLayer.attributes), {
      id: currentBaseLayer.get('id'),
      order: currentBaseLayer.get('order')
    });
    currentBaseLayer.clear({ silent: true });
    currentBaseLayer.set(newAttributes);
    currentBaseLayer.save(null, opts);
  },

  _replaceBaseLayer: function(currentBaseLayer, newBaseLayer, opts) {
    this.layers.remove(currentBaseLayer);
    newBaseLayer.set({
      id: currentBaseLayer.get('id'),
      order: currentBaseLayer.get('order')
    });
    this.layers.add(newBaseLayer, { at: 0 });
    newBaseLayer.save(null, opts);
  },

  _addBaseLayer: function(newBaseLayer, opts) {
    this.layers.add(newBaseLayer, { at: 0 });
    newBaseLayer.save(null, opts);
  },

  _hasLabelsLayer: function() {
    return this.layers.size() > 1 && this.layers.last().get('type') === 'Tiled';
  },

  _updateLabelsLayer: function(baseLayer, opts) {
    var labelsLayer = this.layers.last();
    labelsLayer.set({
      name: this._labelsLayerNameFromBaseLayer(baseLayer),
      urlTemplate: baseLayer.get('labels').urlTemplate,
      attribution: baseLayer.get('attribution'),
      minZoom: baseLayer.get('minZoom'),
      maxZoom: baseLayer.get('maxZoom'),
      subdomains: baseLayer.get('subdomains')
    });
    labelsLayer.save(null, opts);
  },

  _addLabelsLayer: function(baseLayer, opts) {
    this.layers.add({
      name: this._labelsLayerNameFromBaseLayer(baseLayer),
      urlTemplate: baseLayer.get('labels').urlTemplate,
      attribution: baseLayer.get('attribution'),
      minZoom: baseLayer.get('minZoom'),
      maxZoom: baseLayer.get('maxZoom'),
      subdomains: baseLayer.get('subdomains'),
      kind: "tiled"
    });
    var labelsLayer = this.layers.last();
    labelsLayer.save(null, opts);
  },

  _destroyLabelsLayer: function(opts) {
    this.layers.last().destroy(opts);
  },

  _labelsLayerNameFromBaseLayer: function(baseLayer) {
    return baseLayer.get('name') + " Labels";
  },

  /**
   * the first version of cartodb contains one single layer
   * per table with information.
   */
  addDataLayer: function(lyr) {
    this.addLayer(lyr);
    this.set({ dataLayer: lyr });
  },

  /**
   * create a new map. this is a helper to use from javascript command line
   */
  create: function() {
    this.unset('id');
    this.set({ table_id: this.table.id });
    this.save();
  },

  /**
   * enable save map each time the viewport changes
   * not working
   */
  autoSave: function() {
    this.bind('change:center', this.save);
    this.bind('change:zoom', this.save);
  },

  toJSON: function() {
    var c = _.clone(this.attributes);
    // data layer is a helper to work in local
    delete c.dataLayer;
    return c;
  },

  /**
   * change provider and optionally baselayer
   */
  changeProvider: function(provider, baselayer) {
    var self = this;

    if(baselayer && baselayer.get('id')) {
      cdb.log.error("the baselayer should not be saved in the server");
      return;
    }
    var _changeBaseLayer = function() {
      if(baselayer) {
        self.setBaseLayer(baselayer);
      }
    }
    if(this.get('provider') !== provider) {
      this.save({ provider: provider }, {
        success: function() {
          _changeBaseLayer();
          self.change();
        },
        error: function(e, resp) {
          self.error(_t('error switching base layer'), resp);
        },
        silent: true
      });
    } else {
      _changeBaseLayer();
    }
  },

  isProviderGmaps: function() {
    var provider = this.get("provider");
    return provider && provider.toLowerCase().indexOf("googlemaps") !== -1
  },

  clone: function(m) {
    m = m || new cdb.admin.Map();
    var attrs = _.clone(this.attributes)
    delete attrs.id;
    m.set(attrs);

    // clone lists
    m.set({
      center:           _.clone(this.attributes.center),
      bounding_box_sw:  _.clone(this.attributes.bounding_box_sw),
      bounding_box_ne:  _.clone(this.attributes.bounding_box_ne),
      view_bounds_sw:   _.clone(this.attributes.view_bounds_sw),
      view_bounds_ne:   _.clone(this.attributes.view_bounds_ne),
      attribution:      _.clone(this.attributes.attribution)
    });

    // layers
    this.layers.clone(m.layers);
    m.layers.map = m;

    return m;
  },

  notice: function(msg, type, timeout) {
    this.trigger('notice', msg, type, timeout);
  },

  error: function(msg, resp) {
    var err =  resp && JSON.parse(resp.responseText).errors[0];
    this.trigger('notice', msg + " " + err, 'error');
  },

  addCartodbLayerFromTable: function(tableName, userName, opts) {
    opts = opts || {};
    /*var newLayer = cdb.admin.CartoDBLayer.createDefaultLayerForTable(tableName, userName);
    this.layers.add(newLayer);
    newLayer.save(null, opts);
    */

    var self = this;
    var table = new cdb.admin.CartoDBTableMetadata({ id: tableName });
    table.fetch({
      success: function() {
        // Get the layers for the map
        var map = new cdb.admin.Map({ id: table.get('map_id') });
        map.layers.bind('reset', function() {
          var newLayer = map.layers.at(1).clone();
          newLayer.unset('order');

          function layerReady() {
            newLayer.table.unbind('change:geometry_types', layerReady);
            // when the layer is torque and there are other torque layers in the map, switch it to a
            // simple visualization layer
            if (newLayer.wizard_properties.get('type') === 'torque' && self.layers.getTorqueLayers().length) {
              newLayer.wizard_properties.active('polygon');
            }
            // wait: true is used to make sure the layer is not added until confirmed it was added successfully
            // pass opts for success/error callbacks to be triggered as expected
            self.layers.create(newLayer, _.extend({ wait: true }, opts));
          }

          // Wait until the layer is totally ready in order to add it to the layers and save it
          if (newLayer.isTableLoaded()) {
            layerReady();
          } else {
            newLayer.table.bind('change:geometry_types', layerReady);
            newLayer.table.data().fetch();
          }
        });
        map.layers.fetch();
      }
    });
  },

  // moves the map to interval [-180, 180]
  clamp: function() {
    var fmod = function (a,b) { return Number((a - (Math.floor(a / b) * b)).toPrecision(8)); };
    var latlng = this.get('center');
    var lon = latlng[1];
    if(lon < -180 || lon > 180) {
      lon = fmod(180 + lon, 360) - 180;
      this.set('center', [latlng[0], lon]);
    }
    return this;
  }
});
