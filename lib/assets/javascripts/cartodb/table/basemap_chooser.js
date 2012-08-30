/**
 * small photo of available base map layers
 */

cdb.admin.BaseMapView = cdb.core.View.extend({

  events: {
    'click': 'activate'
  },

  defaults: {
    // x,y,z position of the base tile preview
    x: 30,
    y: 24,
    z: 6
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
    'click span.button' : '_openPicker',
    'click'             : 'activate'
  },

  tagName: 'li',
  className: 'map_background',

  initialize: function() {
    // this.options = _.defaults(this.options,this.defaults);
    // this.map = this.options.map;
  },

  render: function() {
    this.$el.append("<a href='#change_background' style='background:" 
      + "#FFFFFF" + "'><span class='color'>" +
      "#FFFFFF" + "</span><span class='button'></span></a>");

    this._initPicker();

    return this;
  },

  activate: function(e) {
    e.preventDefault();
    return false;
  },

  _initPicker: function() {
    var self = this;

    this.color_picker = new cdb.admin.ColorPicker({
      target: this.$el,
      template_base: 'common/views/color_picker',
      vertical_position: "down",
      horizontal_position: "left",
      horizontal_offset: 15,
      tick: "left"
    }).bind("colorChosen", function(color) {
      // Put new color
      self.$el.find("a").css({ "background": color })
      self.$el.find("span.color").text(color);

      // Set new model

    });
  },

  _openPicker: function(ev) {
    ev.preventDefault();
    ev.stopPropagation();

    cdb.god.unbind("closeDialogs", this.color_picker.hide, this.color_picker);
    cdb.god.unbind("closeDialogs:color", this.color_picker.hide, this.color_picker);

    cdb.god.trigger("closeDialogs:color");

    if (!this.color_picker.el.parentElement) {
      $('body').append(this.color_picker.render().el);
      this.color_picker.init("#FFFFFF");
      
      cdb.god.bind("closeDialogs", this.color_picker.hide, this.color_picker);
      cdb.god.bind("closeDialogs:color", this.color_picker.hide, this.color_picker);
    } else {
      this.color_picker.hide();
    }
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

    var dialog = new cdb.admin.BaseMapAdder({
      model: this.model, //map
      baseLayers: this.baseLayers
    });
    dialog.appendToBody().open();

    return false;
  },

  add: function(lyr) {
    var v = new cdb.admin.BaseMapView({ model: lyr, map: this.model });
    cdb.log.debug("added base layer option: " + lyr.get('urlTemplate'));
    this.addView(v);

    if (this.$el.find("li.map_background").length > 0) {
      // Insert before the map background li
      $(v.render().el).insertBefore(this.$el.find("li.map_background"));
    } else {
      this.$el.append(v.render().el);
    }
    
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
