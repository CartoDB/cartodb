/**
 * small photo of available base map layers
 */

cdb.admin.BaseMapView = cdb.core.View.extend({

  events: {
    'click': 'activate'
  },

  defaults: {
    // x,y,z position of the base tile preview
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
    layer.save();
    cdb.log.debug("enabling layer: " + layer.get('urlTemplate'));
    return false;
  }

});



cdb.admin.BackgroundMapColor = cdb.core.View.extend({

  events: {
    'click': 'activate'
  },

  tagName: 'li',

  initialize: function() {
    // this.options = _.defaults(this.options,this.defaults);
    // this.map = this.options.map;
  },

  render: function() {
    this.$el.append("<a href='#change_background' style='background:" 
      + this.model.get("background") + "'><span class='color'>" +
      this.model.get("background") + "</span><span class='button'></span></a>");

    return this;
  },

  activate: function(e) {
    e.preventDefault();

    // this.model
    //   .set("background","lime")
    //   .save();
    
    // var layer = this.map.getBaseLayer();
    // layer.set(this.model.clone());
    // layer.save();
    // cdb.log.debug("enabling layer: " + layer.get('urlTemplate'));
    
    return false;
  }

});




cdb.admin.BaseMapChooser = cdb.core.View.extend({

  tagName: 'ul',

  events: {
    "click a.add" : "_openSelector"
  },

  initialize: function() {
    _.bindAll(this, 'add');
    this.baseLayers = this.options.baseLayers;
    this.baseLayers.bind('reset', this.render, this);
    this.baseLayers.bind('add', this.add, this);
  },

  _addBaseDefault: function() {
    this.baseLayers.each(this.add);
  },


  _addSelector: function() {
    this.$el.append("<li><a href='#add_new_one' class='add'><span></span></a></li>");
  },

  _openSelector: function(ev) {
    ev.preventDefault();

    var dialog = new cdb.admin.BaseMapAdder({});
    dialog.appendToBody().open();

    return false;
  },

  add: function(lyr) {
    var v = new cdb.admin.BaseMapView({ model: lyr, map: this.model });
    cdb.log.debug("added base layer option: " + lyr.get('urlTemplate'));
    this.addView(v);
    this.$el.append(v.render().el);
  },

  _addBackgroundView: function() {
    var v = new cdb.admin.BackgroundMapColor({ model: this.model });
    cdb.log.debug("added background map color selector");
    this.addView(v);
    this.$el.append(v.render().el);
  },

  render: function() {
    this.$el.html('');
    // Draw default layers
    this._addBaseDefault();

    // Add background map selector
    this._addBackgroundView();

    // Add tile button selector
    this._addSelector();

    return this;
  }

});
