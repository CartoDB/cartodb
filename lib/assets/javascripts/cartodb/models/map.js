
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
      old_template_name:  this.attributes.old_template_name
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
      order: data.order
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
      order: data.order
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
      order: data.order
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
      order: data.order
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
  }

});


cdb.admin.CartoDBLayer = cdb.geo.CartoDBLayer.extend({
  MAX_HISTORY: 5,
  MAX_HISTORY_QUERY: 5,
  MAX_HISTORY_TILE_STYLE: 5,

  initialize: function() {
    this._sync = _.debounce(Backbone.sync, 500);

    this.set('use_server_style', true);

    this.initHistory('query');
    this.initHistory('tile_style');

    this.table = new cdb.admin.CartoDBTableMetadata({
      id: this.get('table_name')
    });

    this.infowindow = new cdb.geo.ui.InfowindowModel({
      template_name:  'infowindow_light'
    });

    this.legend = new cdb.geo.ui.LegendModel({ });

    // Bindings
    this.bind('change:table_name', function() {
      this.table.set('id', this.get('table_name')).fetch();
    }, this);

    this.bindTable(this.table);
    this.bindInfowindow(this.infowindow);
    this.bindLegend(this.legend);

    this.table.fetch();
  },

  getLayerDef: function() {
    var attr = this.attributes;
    var query = attr.query || "select * from " + attr.table_name;
    if(attr.query_wrapper) {
      query = _.template(attr.query_wrapper)({ sql: query });
    }
    return {
      type: 'cartodb',
      options: {
        sql: query,
        cartocss: this.get('tile_style'),
        cartocss_version: '2.1.1',
        interactivity: this.get('interactivity')
      }
    }
  },



  toLayerGroup: function() {
    var attr = _.clone(this.attributes);
    attr.layer_definition = {
      version:'1.0.1',
      layers: [this.getLayerDef()]
    };
    attr.type = 'layergroup'
    return attr;
  },

  /**
   * Initializes the history if it doesn't exits and sets the position pointer to 0
   * @param  {string} property
   */
  initHistory: function(property) {
    if(!this.get(property+'_history')) {
      this.set(property+'_history', []);
    }
    this[property+'_history_position'] = 0;
    this[property+'_storage'] = new cdb.admin.localStorage(property+'_storage_'+this.get('table_name'));
  },
  /**
   * Add a value to the property history if it's not the same than the last one
   * @param {string} property
   * @param {string} value
   */
  addToHistory: function(property, value) {
    if(value != this.get(property+'_history')[this.get(property+'_history').length - 1]) {
      this.get(property+'_history').push(value);
      this.trimHistory(property);
      this[property+'_history_position'] = this.get(property+'_history').length - 1;
    }
  },
  /**
   * Trim the history array to make sure its length isn't over MAX_HISTORY
   * @param  {String} property [description]
   */
  trimHistory: function(property) {
    var limit = this['MAX_HISTORY_'+property.toUpperCase()] ?
      this['MAX_HISTORY_'+property.toUpperCase()] :
      this.MAX_HISTORY;
    while(this.get(property+'_history').length > limit) {
      var removedValue = this.get(property+'_history').splice(0,1);
      this[property+'_storage'].add(removedValue[0]);
    }
  },
  /**
   * Moves the history position pointer n positions and notify that the property needs to be refreshed on views
   * @param  {String} property
   * @param  {Integer} n
   */
  moveHistoryPosition: function(property, n) {
      var newPosition = this[property+'_history_position'] + n;
    if(newPosition >= 0 && newPosition < this.get(property+'_history').length) {
      this[property+'_history_position'] = newPosition;
    } else {
      if(newPosition < 0 && Math.abs(newPosition) <= this[property+'_storage'].get().length) {
        this[property+'_history_position'] = newPosition;
      }
    }
  },
  /**
   * returns the value saved on the position of the current _history_position, either from memory of from localStorage
   * @param  {String} property
   * @return {String}
   */
  getCurrentHistoryPosition: function(property) {
    var currentPosition = this[property+'_history_position'];
    if(this[property+'_history_position'] >= 0) {
      return this.get(property+'_history')[currentPosition];
    } else {
      if(Math.abs(currentPosition) <= this[property+'_storage'].get().length) {

        return this[property+'_storage'].get(this[property+'_storage'].get().length - Math.abs(currentPosition));
      } else {
        return this.get(property+'_history')[0]
      }
    }

  },
  /**
   * Advances by one the history_position and returns the value saved on that pos
   * @param  {String} property
   * @return {String}
   */
  redoHistory: function(property) {
    this.moveHistoryPosition(property, 1);
    return this.getCurrentHistoryPosition(property);
  },
  /**
   * Reduces by one the history_position and returns the value saved on that pos
   * @param  {String} property
   * @return {String}
   */
  undoHistory: function(property) {
    var h = this.getCurrentHistoryPosition(property);
    this.moveHistoryPosition(property, -1);
    return h;
  },

  isHistoryAtLastPosition: function(property) {
    if(this.get(property+'_history').length === 0) {
      return true;
    }
    return ((this.get(property+'_history').length-1) == this[property+'_history_position']);
  },

  isHistoryAtFirstPosition: function(property) {
    if(this.get(property+'_history').length === 0) {
      return true;
    }
    var stored = this[property+'_storage'].get();
    if(stored && stored.length === 0) {
      if(this[property+'_history_position'] === 0) {
        return true;
      }
    } else {
      var storedSize = stored ? 1*stored.length : 0;
      var minimumPos = -1* storedSize;
      return (minimumPos == this[property+'_history_position']);
    }
    return false;
  },

  clone: function() {
    var attr = _.clone(this.attributes);
    delete attr.id;
    return new cdb.admin.CartoDBLayer(attr);
  },

  toJSON: function() {
    var c = _.clone(this.attributes);
    // remove api key
    if(c.extra_params) {
      c.extra_params = _.clone(this.attributes.extra_params);
      if(c.extra_params.api_key) {
        delete c.extra_params.api_key;
      }
      if(c.extra_params.map_key) {
        delete c.extra_params.map_key;
      }
    }

    var infowindow = c.infowindow;
    delete c.infowindow;
    var d = {
      // for some reason backend does not accept cartodb as layer type
      kind: c.type.toLowerCase() === 'cartodb' ? 'carto': c.type,
      options: c,
      order: c.order,
      infowindow: infowindow
    };
    if(c.id !== undefined) {
      d.id = c.id;
    }
    return d;
  },

  parse: function(data, options) {
    options = options || {};
    if (options.no_override) {
      return {};
    }
    var c = {};

    // if api_key exist alread, set in params to not lose it
    if(data.options.extra_params && this.attributes && this.attributes.extra_params) {
      data.options.extra_params.map_key = this.attributes.extra_params.map_key;
    }

    _.extend(c, data.options, {
      id: data.id,
      type: data.kind === 'carto' ? 'CartoDB': data.kind,
      infowindow: data.infowindow,
      order: data.order
    });

    return c;
  },

  sync: function(method, model, options) {
    if(method != 'read') {
      options.data =  JSON.stringify(model.toJSON());
    }
    options.contentType = 'application/json';
    options.url = model.url();
    this._sync(method, null, options);
  },

  unbindSQLView: function(sqlView) {
    this.sqlView.unbind(null, null, this);
    this.sqlView = null;
  },

  bindSQLView: function(sqlView) {
    var self = this;
    this.sqlView = sqlView;
    this.sqlView.bind('error', this.errorSQLView, this);

    // on success and no modify rows save the query!
    this.sqlView.bind('reset', function() {
      if(self.sqlView.modify_rows) {
        self.set({ query: null });
        self.invalidate();
        self.table.useSQLView(null, { force_data_fetch: true });
        self.trigger('clearSQLView');
      } else {
        self.save({
          query: sqlView.getSQL(),
          sql_source: sqlView.sqlSource()
        });
      }
    }, this);

    // Set sql view if query was applied
    var sql = this.get('query');
    if (sql) {
      this.applySQLView(sql, { add_to_history: false });
    }
  },

  bindTable: function(table) {
    this.table = table;
    var self = this;
    self.table.bind('change:name', function() {
      if (self.get('table_name') != self.table.get('name')) {
        self.save({ table_name: self.table.get('name') });
        self.updateCartoCss(self.table.previous('name'), self.table.get('name'));
      }
    });

    this.table.bind('change:schema', function() {
      var interactivity = null;
      if(this.table.containsColumn('cartodb_id')) {
        interactivity = 'cartodb_id';
      }
      if(self.get('interactivity') !== interactivity) {
        self.save({ interactivity: interactivity });
      }
    }, this);
  },

  bindLegend: function(legend) {
    var data = this.get('legend');

    if (data) {
      this.legend.set(data);
    }

    this.legend.bind('change:template change:type change:title change:show_title change:items', _.debounce(function() {
      // call with silent so the layer is no realoded
      // if some view needs to be changed when the legend is changed it should be
      // subscribed to the legend model not to dataLayer
      // (which is only a data container for the legend)
      if (!this.isNew()) {
        this.save({ legend: this.legend.toJSON() }, { silent: true });
      }
    }, 250), this);

  },

  bindInfowindow: function(infowindow) {
    var infowindowData = this.get('infowindow');
    if(infowindowData) {
      this.infowindow.set(infowindowData);
    } else {
      // assign a position from start
      var pos = 0;
      _(this.table.get('schema')).each(function(v) {
        if(!_.contains(['the_geom', 'created_at', 'updated_at', 'cartodb_id'], v[0])) {
          this.infowindow.addField(v[0], pos);
          ++pos;
        }
      });
    }

    this.table.linkToInfowindow(this.infowindow);

    var watchedFields = 'change:fields change:template_name change:alternative_names change:template change:disabled';
    var deferredSave = _.debounce(function() {
      // call with silent so the layer is no realoded
      // if some view needs to be changed when infowindow is changed it should be
      // subscribed to infowindow model not to dataLayer
      // (which is only a data container for infowindow)

      // since removeMissingFields changes fields, unbind changes temporally
      this.infowindow.unbind(watchedFields, deferredSave, this);
      // assert all the fields are where they should
      infowindow.removeMissingFields(this.table.columnNames());
      this.infowindow.bind(watchedFields, deferredSave, this);
      if (!this.isNew()) {
        this.save({ infowindow: this.infowindow.toJSON() }, { silent: true });
      }
    }, 250);

    this.infowindow.bind(watchedFields, deferredSave, this);
  },

  resetQuery: function() {
    this.save({
      query: undefined,
      sql_source: null,
      interactivity: 'cartodb_id'
    });
  },

  errorSQLView: function(m, e) {
    this.save({ query: null }, { silent: true });
    this.trigger('errorSQLView', e);
  },

  clearSQLView: function() {
    // before reset query we should remove the view
    this.table.useSQLView(null);
    this.addToHistory("query", "SELECT * FROM " + this.table.get('name'));
    // undo history to move backwards the history pointer
    this.undoHistory("query");
    this.resetQuery();
    this.trigger('clearSQLView');
  },

  applySQLView: function(sql, options) {
    options = options || {
      add_to_history: true,
      sql_source: null
    };
    // if the sql change the table data do not save in the data layer
    // pass though and launch the query directly to the table
    this.table.useSQLView(this.sqlView);
    this.sqlView.setSQL(sql, {
      silent: true,
      sql_source: options.sql_source || null
    });
    if(options.add_to_history) {
      this.addToHistory("query", sql);
    }
    // if there is some error the query is rollbacked
    this.sqlView.fetch();
    this.trigger('applySQLView', sql);
  },

  moveToFront: function(opts) {
    this.save({
      'order': this.collection.last().get('order') + 1
    }, opts);
  }

}, {

  createDefaultLayerForTable: function(tableName, userName) {
    return new cdb.admin.CartoDBLayer({
      user_name: userName,
      table_name: tableName,
      tile_style: "#" + tableName + cdb.admin.CartoStyles.DEFAULT_GEOMETRY_STYLE,
      style_version: '2.1.0',
      visible: true,
      interactivity: 'cartodb_id',
      sql_api_domain: cdb.config.get('sql_api_domain'),
      sql_api_endpoint: cdb.config.get('sql_api_endpoint'),
      sql_api_port: cdb.config.get('sql_api_port'),
      tiler_domain: cdb.config.get('tiler_domain'),
      tiler_port: cdb.config.get('tiler_port'),
      no_cdn: true
    });
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
  // depending of the kind of layer creates a
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
    function torque_filter(m) {
      return (m.get ? m.get('type'):(m.type || m.kind) ) === 'torque';
    };
    models = _.isArray(models) ? models: [models];
    // search for more than one torque layer
    var torque_layers = _.filter(models, torque_filter).length +
                        _.filter(this.models, torque_filter).length;
    if(torque_layers > 1) {
      this.trigger('error:torque', "only one torque layer is allowed per map");
      return;
    }
    return Backbone.Collection.prototype.add.apply(this, arguments);
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
      return _.contains(self._DATA_LAYERS, lyr.get('type')) && lyr.get('legend') && lyr.get('legend').type;
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

  url: function() {
    return '/api/v1/maps/' +  this.map.id + '/layers';
  },

  parse: function(data) {
    return data.layers;
  },

  saveLayers: function(opts) {
    this.each(function(l) {
      l.save(null, opts);
    });
  },

  /**
   * on reset order the layers so tiled layer are under cartodb layers
   */
  reset: function(models, options) {
    var sortOrder = {
      'Tiled': 0,
      'CartoDB': 1,
      'tiled': 0,
      'carto': 1,
      'torque': 2
    };
    var sortModels = function(a, b) {
      return sortOrder[a.get('type')] - sortOrder[b.get('type')];
    };
    var sortRaw = function(a, b) {
      return sortOrder[a.kind] - sortOrder[b.kind];
    };

    if(_.size(models)) {
      // if is not a model use raw sort
      _(models).sort(models[0].get === undefined ? sortRaw : sortModels);
    }

    Backbone.Collection.prototype.reset.call(this, models, options);
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
    this.delayedSave = _.debounce(this.save, 1000);
    //this.autoSave();
    this.bind('change:id', this._fetchLayers, this);

    this.layers = new cdb.admin.Layers();
    this.layers.map = this;
    this.layers.bind('reset', this._layersChanged, this);
    this.layers.bind('add', this._layersChanged, this);
  },

  saveLayers: function(opts) {
    opts = opts || {};
    var none = function() {}
    var success = _.after(this.layers.length, opts.success || none);
    this.layers.saveLayers({
      success: success,
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

  _setBaseLayer: function(layer, opts) {
    opts = opts || {};
    var self = this;
    var old = this.layers.at(0);

    // Check if the selected base layer is already selected
    if (this.isBaseLayerAdded(layer)) {
      opts.alreadyAdded && opts.alreadyAdded();
      return false;
    }

    if (old) { // defensive programming FTW!!
      //remove layer from the view
      //change all the attributes and save it again
      //it will saved in the server and recreated in the client
      self.layers.remove(old);
      layer.set('id', old.get('id'));
      layer.set('order', old.get('order'));
      this.layers.add(layer, { at: 0 });
      layer.save(null, {
        success: function() {
          self.trigger('baseLayerAdded');
          self._adjustZoomtoLayer(layer);
          opts.success && opts.success();
        },
        error: opts.error
      })

    } else {
      self.layers.add(layer, { at: 0 });
      self.trigger('baseLayerAdded');
      self._adjustZoomtoLayer(layer);
      opts.success && opts.success();
    }


    // Update attribution removing old one and adding new one
    this.updateAttribution(old, layer);

    return layer;
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
  setBaseLayer: function(layer) {
    var self = this;

    this.trigger('savingLayers');

    var done = _.after(this.layers.size(), function() {
      self.trigger('savingLayersFinish');
    });

    return this._setBaseLayer(layer, {
      success: function() {
        self.layers.saveLayers({
          success: function() {
            done && done();
          },
          error: function() {
            cdb.log.error("error saving layer order");
            self.trigger('savingLayersFinish');
          }
        });
      },
      error: function() {
        self.trigger('savingLayersFinish');
        self.trigger('savingLayersError');
      },
      alreadyAdded: function() {
        self.trigger('savingLayersFinish');
      }
    });
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
    this.bind('change:center', this.delayedSave);
    this.bind('change:zoom', this.delayedSave);
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
        //get layers for the map
        var map = new cdb.admin.Map({ id: table.get('map_id') });
        map.layers.bind('reset', function() {
          var newLayer = map.layers.at(1).clone();
          newLayer.unset('order');
          // wait until the layer is totally ready in order to add it to the
          // layers and save it
          newLayer.table.bind('change', function layerReady() {
            newLayer.table.unbind('change', layerReady);
            self.layers.add(newLayer);
            // check if there was error checking if the layer is added
            if (newLayer.collection) {
              newLayer.save(null, opts);
            }
          });
        });
        map.layers.fetch();
      }
    });
  }

});
