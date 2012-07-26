
_.extend(cdb.geo.MapLayer.prototype, {
//cdb.admin.MapLayer = cdb.geo.MapLayer.extend({

  parse: function(data) {
    var c = {};
    var typeMap = {
      'Layer::Tiled': 'Tiled',
      'Layer::Carto': 'CartoDB',
      'carto': 'CartoDB'
    };
    _.extend(c, data.options, {
      id: data.id,
      type: typeMap[data.kind]
    });
    return c;
  },

  toJSON: function() {
    var c = _.clone(this.attributes);
    // api expects two kinds, map from layer types to 
    // api kinds
    var typeMap = {
      'CartoDB': 'carto',
      'Tiled': 'tiled'
    };
    var d = {
      kind:  typeMap[c.type],
      options: c
    };
    if(c.id !== undefined) {
      d.id = c.id;
    }
    return d;
  }

});

cdb.admin.Layers = cdb.geo.Layers.extend({

  model: cdb.geo.MapLayer,

  url: function() {
    return '/api/v1/maps/' +  this.map.id + '/layers';
  },

  parse: function(data) {
    return data.layers;
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
  },

  _layersChanged: function() {
    if(this.layers.size() == 2) {
      this.set({ dataLayer: this.layers.at(1) });
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
   * the first version of cartodb contains one single layer
   * per table with information.
   */
  addDataLayer: function(lyr) {
    this.addLayer(lyr);
    this.set({ dataLayer: lyr });
  },

  create: function() {
    this.unset('id');
    this.set({ table_id: this.table.id });
    this.save();
  },

  /**
   * enable save map each time the viewport changes
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
  }

});
