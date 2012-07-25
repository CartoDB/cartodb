/**
 * small photo of available base map layers
 */

cdb.admin.BaseMapView = cdb.core.View.extend({

  events: {
    'click': 'activate'
  },

  defaults: {
    x: 2005,
    y: 1544,
    z: 12
  },

  tagName: 'li',

  initialize: function() {
    this.options = _.defaults(this.options,this.defaults);
    this.map = this.options.map;
  },

  render: function() {
    //TODO: move this to model
    var back_tile = this.model.get("urlTemplate").replace("{z}", this.options.z).replace("{x}", this.options.x).replace("{y}", this.options.y)
      , a = this.make("a", {"style": "background:url(" + back_tile + ") no-repeat 0 0"}, this.cid);

    this.$el.html(a);

    return this;
  },

  activate: function(e) {
    e.preventDefault();
    var layer = this.map.getBaseLayer();
    layer.set(this.model.clone());
    cdb.log.debug("enabling layer: " + layer.get('urlTemplate'));
    return false;
  }

});

cdb.admin.BaseMapChooser = cdb.core.View.extend({

  tagName: 'ul',

  initialize: function() {
    _.bindAll(this, 'add');
    this.baseLayers = this.options.baseLayers;
    this.baseLayers.bind('reset', this.render, this);
    this.baseLayers.bind('add', this.add, this);
  },

  _addAll: function() {
    this.baseLayers.each(this.add);
  },

  add: function(lyr) {
    var v = new cdb.admin.BaseMapView({ model: lyr, map: this.model });
    cdb.log.debug("added base layer option: " + lyr.get('urlTemplate'));
    this.addView(v);
    this.$el.append(v.render().el);
  },

  render: function() {
    this.$el.html('');
    this._addAll();
    return this;
  }

});
