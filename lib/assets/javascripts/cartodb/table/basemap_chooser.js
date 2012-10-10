/**
 * small photo of available base map layers
 */

cdb.admin.GMapsBaseView = cdb.core.View.extend({

  events: {
    'click': 'activate'
  },

  tagName: 'li',

  initialize: function() {
    this.options = _.defaults(this.options,this.defaults);
    this.map = this.options.map;
  },

  render: function() {
    var a = this.make("a", {"class": "gmaps_" + this.model.get('base_type') }, this.cid);
    this.$el.html(a);
    return this;
  },

  activate: function(e) {
    e.preventDefault();
    this.map.save({ provider: 'googlemaps' });
    var base = this.model.clone();
    this.map.setBaseLayer(base);
    // save all the layers to store the order in the server
    this.map.layers.saveLayers();

    return false;
  }

});

cdb.admin.BaseMapView = cdb.core.View.extend({

  events: {
    'click span.remove_layer': '_openDropdown',
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
    this.model.bind('destroy', this.clean, this);
  },

  render: function() {
    //TODO: move this to model
    var back_tile = this.model.get("urlTemplate").replace("{z}", this.options.z).replace("{x}", this.options.x).replace("{y}", this.options.y)
      , a = this.make("a", {"style": "background-image:url(" + back_tile + ");"}, this.cid);

    if(!this.model.get('read_only')) {
      del = this.make("span", {"class": "remove_layer"});
      $(a).append(del);
    }


    this.$el.html(a);
    this.$el.attr('data-tipsy', 'click to change the base layer');
    this.$el.tipsy({title: 'data-tipsy'})
    return this;
  },

  activate: function(e) {
    e.preventDefault();
    this.$el.parents('.base_maps').find('li').removeClass('selected');
    this.$el.addClass('selected');
    cdb.god.trigger("closeDialogs");
    // when the user selects a normal base layer select leaflet by default
    if(this.map.get('provider') === 'leaflet') {
      var layer = this.map.getBaseLayer();
      if(layer) {
        var lyr = this.model.clone();
        lyr.set('id', null); // force creation
        this.map.setBaseLayer(lyr);
        // save all the layers to store the order in the server
        this.map.layers.saveLayers();
        cdb.log.debug("enabling layer: " + layer.get('urlTemplate'));
      } else {
        cdb.log.error("looks like the map does not have a base layer?");
      }
    } else {
      this.map.set({ provider: 'leaflet' });
      var lyr = this.model.clone();
      lyr.set('id', null); // force creation
      this.map.setBaseLayer(lyr);
      this.map.save();
      this.map.layers.saveLayers();
    }
    return false;
  },

  _openDropdown: function(ev) {
    var self = this;

    ev.preventDefault();
    ev.stopPropagation();

    cdb.god.trigger("closeDialogs");

    this.dropdown = new cdb.admin.DropdownMenu({
      className: 'dropdown border',
      target: this.$('.remove_layer'),
      width: 196,
      speedIn: 150,
      speedOut: 300,
      template_base: 'table/views/remove_layer_content',
      vertical_position: "down",
      horizontal_position: "left",
      horizontal_offset: 3,
      clean_on_hide: true,
      tick: "left"
    }).bind("optionClicked", function(ev) {
      ev.preventDefault();
      self.model.destroy();
    });

    cdb.god.bind("closeDialogs", this.dropdown.hide, this.dropdown);

    $('body').append(this.dropdown.render().el);
    this.dropdown.open(ev);
  }

});



cdb.admin.BackgroundMapColorView = cdb.core.View.extend({

  events: {
    'click span.button' : '_openPicker',
    'click'             : 'activate'
  },

  tagName: 'li',
  className: 'map_background',

  initialize: function() {
    // this.options = _.defaults(this.options,this.defaults);
    this.map = this.model;
    this.current_color = '#FFFFFF';
  },

  render: function() {
    this.$el.append("<a href='#change_background' style='background:"
      + "#FFFFFF" + "'><span class='color'>" +
      "#FFFFFF" + "</span><span class='button'></span></a>");
    this.$el.attr('data-tipsy', 'click to change the map background color');
    this._initPicker();

    return this;
  },

  activate: function(e) {
    var lyr = new cdb.admin.PlainLayer({
      color: this.current_color
    });
    this.map.setBaseLayer(lyr);
    this.map.save();
    // save all the layers to store the order in the server
    this.map.layers.saveLayers();
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
      self.current_color = color;

    });
  },

  _openPicker: function(ev) {
    ev.preventDefault();
    ev.stopPropagation();

    cdb.god.unbind("closeDialogs", this.color_picker.hide, this.color_picker);

    cdb.god.trigger("closeDialogs");

    if (!this.color_picker.el.parentElement) {
      $('body').append(this.color_picker.render().el);
      this.color_picker.init("#FFFFFF");

      cdb.god.bind("closeDialogs", this.color_picker.hide, this.color_picker);
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
    var $li = $("<li><a href='#add_new_one' class='add'><span></span></a></li>");
    this.$el.append($li);
    $li.attr('data-tipsy', 'click to add a new layer');
    $li.tipsy({title:"data-tipsy"});
  },

  _openSelector: function(ev) {
    ev.preventDefault();
    console.log('bbb')
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

  _addGoogleMaps: function() {
    var available = ['roadmap', 'satellite'];

    for(var i in available) {
      var base = new cdb.admin.GMapsBaseLayer({ base_type: available[i] });
      var v = new cdb.admin.GMapsBaseView({
        model: base,
        map: this.model
      });
      this.addView(v);
      this.$el.append(v.render().el);
    }

  },

  _addBackgroundView: function() {
    var v = new cdb.admin.BackgroundMapColorView({ model: this.model });
    cdb.log.debug("added background map color selector");
    this.addView(v);
    this.$el.append(v.render().el);
  },

  render: function() {
    this.$el.html('');
    // Draw default layers
    this._addBaseDefault();

    this._addGoogleMaps();
    // Add background map selector
    this._addBackgroundView();

    // Add tile button selector
    this._addSelector();

    this.$el.find('li').map(function(e,i) {
      var $li = $(i);
      if(!$li.attr('data-tipsy')) {
        $li.attr('data-tipsy', 'click to change the base layer');
        $li.tipsy({title:"data-tipsy"});
      }
    })

    this.$el.find('li.map_background')
      .attr('data-tipsy', 'click to change the background color')
      .tipsy({title:"data-tipsy"});

    return this;
  }

});
