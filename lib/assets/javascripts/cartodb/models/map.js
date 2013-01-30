
/*
 * extend infowindow to serialize only the data we need
 */
_.extend(cdb.geo.ui.InfowindowModel.prototype, {
  toJSON: function() {
    return {
      fields: _.clone(this.attributes.fields),
      template_name: this.attributes.template_name,
      old_fields: this.attributes.old_fields
    };
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
      type: 'GMapsBase'
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
 * extend plain layer for data serialization
 */
cdb.admin.PlainLayer= cdb.geo.PlainLayer.extend({

  parse: function(data) {
    var c = {};
    _.extend(c, data.options, {
      id: data.id,
      type: 'Plain'
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

  parse: function(data) {
    var c = {};
    _.extend(c, data.options, {
      id: data.id,
      className: "c_" + data.id,
      type: 'Tiled'
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
    this.set('use_server_style', true);
    this.initHistory('query');
    this.initHistory('tile_style');
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
    this.moveHistoryPosition(property, 1)
    return this.getCurrentHistoryPosition(property)
  },
  /**
   * Reduces by one the history_position and returns the value saved on that pos
   * @param  {String} property
   * @return {String}
   */
  undoHistory: function(property) {
    this.moveHistoryPosition(property, -1)
    return this.getCurrentHistoryPosition(property)
  },
  isHistoryAtLastPosition: function(property) {
    if(this.get(property+'_history').length == 0) {
      return true
    }
    return ((this.get(property+'_history').length-1) == this[property+'_history_position']);
  },
  isHistoryAtFirstPosition: function(property) {
    if(this.get(property+'_history').length == 0) {
      return true
    }
    var stored = this[property+'_storage'].get();
    if(stored && stored.length == 0) {
      if(this[property+'_history_position'] == 0) {
        return true
      }
    } else {
      var storedSize = stored? 1*stored.length : 0
      var minimumPos = -1* storedSize;
      return (minimumPos == this[property+'_history_position']);
    }
    return false
  },

  clone: function() {
    return new cdb.admin.CartoDBLayer(_.clone(this.attributes));
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
      kind: 'carto',
      options: c,
      order: c.order,
      infowindow: infowindow
    };
    if(c.id !== undefined) {
      d.id = c.id;
    }
    return d;
  },

  parse: function(data) {
    var c = {};

    // if api_key exist alread, set in params to not lose it
    if(data.options.extra_params && this.attributes && this.attributes.extra_params) {
      data.options.extra_params.map_key = this.attributes.extra_params.map_key;
    }

    _.extend(c, data.options, {
      id: data.id,
      type: 'CartoDB',
      infowindow: data.infowindow
    });

    return c;
  },

  // cache buster allows to the tiler to know when it has to
  // remove the internal render caches
  updateCacheBuster: function() {
    var s = this.get('extra_params');
    s.cache_buster = new Date().getTime();
  },

  _sync: _.debounce(Backbone.sync, 10),

  sync: function(method, model, options) {
    var self = this;
    this.updateCacheBuster();
    options.data =  JSON.stringify(model.toJSON());
    options.contentType = 'application/json';
    options.url = model.url();
    var st = model.get('tile_style');
    options.wait = false;
    this.saveStyle(this, st, function() {
      // raise model change now in order to update the layer
      if(!options.silent) model.change();
      // dont pass the model to sync
      // the model data is stored in options.data because
      // it needs to be saved when sync is called (and not
      // after it)
      self._sync(method, null, options);
    });
  },

  save: function(attrs, opts) {
    opts = opts || {};
    if(attrs && attrs.tile_style) opts.wait = true;
    cdb.geo.CartoDBLayer.prototype.save.call(this, attrs, opts);
  },

  /**
   * save style to tiler end point
   * this method should be removed in the future
   */
  saveStyle: function(model, st, done) {
    var self = this;

    if(!st) {
      //pass through
      done && done();
      return;
    }

    var protocol = cdb.config.get("tiler_port") == 443 ? 'https': 'http';
    var url = protocol + '://' + this.get('user_name') + "." + cdb.config.get("tiler_domain") + ':' + cdb.config.get("tiler_port") + '/tiles/' + this.get('table_name') + '/style';
    var api_key = this.get('extra_params').map_key;
    var style_version = this.get('style_version');
    if(style_version) {
      style_version = '&style_version=' + style_version;
    } else {
      style_version = '';
    }
    if(api_key) {
      url += '?map_key=' + api_key;
    }
    $.ajax({
      url: url,
      type: 'POST',
      crossOrigin: true,
      data:"style="+  encodeURIComponent(st) + style_version,
      success: function() {
        done && done();
      },
      error: function(res) {
        try {
          var syntaxErrors = JSON.parse(res.responseText);
          self.trigger('parseError', syntaxErrors);
          return;
        } catch(e) {
        }
        self.trigger('error');
      }
    });
  }


});

cdb.admin.Layers = cdb.geo.Layers.extend({

  // the model class works here like a factory
  // depending of the kind of layer creates a
  // type of layer or other
  model: function(attrs, options) {
    var typeClass = {
      'Tiled': cdb.admin.TileLayer,
      'CartoDB': cdb.admin.CartoDBLayer,
      'Plain': cdb.admin.PlainLayer,
      'GMapsBase': cdb.admin.GMapsBaseLayer
    };
    var typeMap = {
      'Layer::Tiled': 'Tiled',
      'Layer::Carto': 'CartoDB',
      'Layer::Background': 'Plain',
      'tiled': 'Tiled',
      'carto': 'CartoDB',
      'background': 'Plain',
      'gmapsbase': 'GMapsBase'
    };

    return new typeClass[typeMap[attrs.kind]](attrs, options);
  },

  url: function() {
    return '/api/v1/maps/' +  this.map.id + '/layers';
  },

  parse: function(data) {
    return data.layers;
  },

  saveLayers: function(opts) {
    this.each(function(l) { l.save(null, opts); });
  },

  /**
   * on reset order the layers so tiled layer are under cartodb layers
   */
  reset: function(models, options) {
    var sortOrder = {
      'Tiled': 0,
      'CartoDB': 1,
      'tiled': 0,
      'carto': 1
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
  setBaseLayer: function(layer) {
    var self = this;

    this.trigger('savingLayers');

    var done = _.after(this.layers.size(), function() {
      self.trigger('savingLayersFinish');
    });

    this.elder('setBaseLayer', layer, {
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

  notice: function(msg, type, timeout) {
    this.trigger('notice', msg, type, timeout);
  },

  error: function(msg, resp) {
    var err =  resp && JSON.parse(resp.responseText).errors[0];
    this.trigger('notice', msg + " " + err, 'error');
  }
});
