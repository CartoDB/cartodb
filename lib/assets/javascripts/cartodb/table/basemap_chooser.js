
cdb.admin.BaseLayerButton = cdb.core.View.extend({

  bindMap: function(map) {
    map.bind('savingLayers', this.disable, this);
    map.bind('savingLayersFinish', this.enable, this);
    map.layers.bind('reset add', this.checkIfSelected, this);
  },

  disable: function() {
    this.$el.addClass('disabled');
    this.undelegateEvents();
  },

  enable: function() {
    this.$el.removeClass('disabled');
    this.delegateEvents();
  },

  selectButton: function() {
    this.$el.parents('.base_maps').find('li').removeClass('selected');
    this.$el.addClass('selected');
  },


  /**
  * Check if the layer is the same than the map's baselayer and if so add the adequate class
  * @method checkIfSelected
  */
  checkIfSelected: function() {
    if(this.options && this.options.map) {
      var baseLayer = this.options.map.getBaseLayer();
      if(!(this.model && this.model.isEqual) ) {
        if(baseLayer.get('type') === 'Plain') {
          this.selectButton();
        }
      } else if(baseLayer && this.model.isEqual(baseLayer)) {
        this.selectButton();
      }
    }
  }

});

/**
 * small photo of available base map layers
 */
cdb.admin.GMapsBaseView = cdb.admin.BaseLayerButton.extend({

  events: {
    'click': 'activate'
  },

  tagName: 'li',

  initialize: function() {
    this.options = _.defaults(this.options,this.defaults);
    this.map = this.options.map;

    this.bindMap(this.map);
  },

  render: function() {
    var a = this.make("a", {"class": "gmaps_" + this.model.get('base_type') }, this.cid);
    this.$el.html(a);
    this.elder('render');
    return this;
  },

  activate: function(e) {
    this.selectButton(); //probably it's still not "really" selected, but let's cheat on the user for UX
    e.preventDefault();
    this.map.changeProvider('googlemaps', this.model.clone());
    return false;
  }

});

cdb.admin.BaseMapView = cdb.admin.BaseLayerButton.extend({

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
    this.bindMap(this.map);
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
    this.$el.attr('data-tipsy', this.model.get("name"));
    this.$el.attr("title", this.model.get("name"));
    this.$el.tipsy({title: 'data-tipsy'})

    this.elder('render');
    return this;
  },

  activate: function(e) {

    e.preventDefault();
    this.selectButton(); //probably it's still not "really" selected, but let's cheat on the user for UX
    cdb.god.trigger("closeDialogs");
    // when the user selects a normal base layer select leaflet by default
    var lyr = this.model.clone();
    lyr.set('id', undefined); // force creation
    this.map.changeProvider('leaflet', lyr);
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



cdb.admin.BackgroundMapColorView = cdb.admin.BaseLayerButton.extend({

  events: {
    'click span.button' : '_openPicker',
    'click'             : '_openPicker'
  },

  tagName: 'li',
  className: 'map_background',

  initialize: function() {

    _.bindAll(this, 'setColor');

    this.map = this.options.map;
    this.current_color = '#FFFFFF';
    this.bindMap(this.map);

  },

  render: function() {

    this.$el.append("<a href='#change_background' style='background:"
      + this.current_color + "'><span class='color'>"
      + this.current_color + "</span><span class='button'></span></a>");

    this.$el.attr('title', 'click to change the map background color');

    this._initPicker();
    this.elder('render');

    return this;
  },

  activate: function() {

    var lyr = new cdb.admin.PlainLayer({
      color: this.current_color
    });

    this.map.changeProvider('leaflet', lyr);

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
    }).bind("colorChosen", this.setColor);

  },

  setColor: function(color) {

    // Put new color
    this.$el.find("a").css({ "background": color })
    this.$el.find("span.color").text(color);

    // Set new model
    this.current_color = color;
    this.activate();

  },

  _openPicker: function(ev) {

    ev.preventDefault();
    ev.stopImmediatePropagation();

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
    _.bindAll(this, 'add', 'selectButton');
    this.baseLayers = this.options.baseLayers;
    this.baseLayers.bind('reset', this.render, this);
    this.baseLayers.bind('add', this.add, this);
    this.model.bind('change reset', this.selectButton)
  },

  selectButton: function() {
    for(var sv in this._subviews) {
      var subview = this._subviews[sv];
      if(subview.model &&
        this.model.getBaseLayer &&
        this.model.getBaseLayer() &&
        this.model.getBaseLayer().isEqual(subview.model)){
        subview.selectButton()
      }
    };
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
    var self = this;
    ev.preventDefault();
    var dialog = new cdb.admin.BaseMapAdder({
      model: this.model, //map
      baseLayers: this.baseLayers,
      ok: function(layer) {
        self.model.changeProvider('leaflet', layer.clone());
      }
    });
    dialog.appendToBody().open();

    return false;
  },

  add: function(lyr) {
    var v = new cdb.admin.BaseMapView({ model: lyr, map: this.model });
    cdb.log.debug("added base layer option: " + lyr.get('urlTemplate'));
    this.addView(v);

    var element = v.render().el;
    var $element = $(element);

    if (this.$el.find("li.map_background").length > 0) {
      // Insert before the map background li
      $element.insertBefore(this.$el.find("li.map_background"));
    } else {
      this.$el.append(element);
    }

    if(!$element.attr('data-tipsy')) {
      $element.attr('data-tipsy', 'your basemap')
      $element.tipsy();
    }
  },

  _addGoogleMaps: function() {
    var
    available = ['roadmap', 'gray_roadmap', 'satellite'],
    names = {
      roadmap:      "Roadmap",
      satellite:    "Satellite",
      gray_roadmap: "Gray Roadmap"
    },
    styles = {
      roadmap: [],
      satellite: [],
      gray_roadmap: [ { stylers: [ { saturation: -65 }, { gamma: 1.52 } ] },{ featureType: "administrative", stylers: [ { saturation: -95 }, { gamma: 2.26 } ] },{ featureType: "water", elementType: "labels", stylers: [ { visibility: "off" } ] },{ featureType: "administrative.locality", stylers: [ { visibility: "off" } ] },{ featureType: "road", stylers: [ { visibility: "simplified" }, { saturation: -99 }, { gamma: 2.22 } ] },{ featureType: "poi", elementType: "labels", stylers: [ { visibility: "off" } ] },{ featureType: "road.arterial", stylers: [ { visibility: "off" } ] },{ featureType: "road.local", elementType: "labels", stylers: [ { visibility: "off" } ] },{ featureType: "transit", stylers: [ { visibility: "off" } ] },{ featureType: "road", elementType: "labels", stylers: [ { visibility: "off" } ] },{ featureType: "poi", stylers: [ { saturation: -55 } ] } ]
    };


    for(var i in available) {
      var layer_name = available[i];
      var base = new cdb.admin.GMapsBaseLayer({ base_type: layer_name, style: styles[layer_name], name: names[layer_name] });

      var v = new cdb.admin.GMapsBaseView({
        model: base,
        map: this.model
      });
      this.addView(v);
      var $view = $(v.render().el);
      $view.attr("title", names[layer_name]);

      this.$el.append($view);
    }

  },

  _addBackgroundView: function() {

    if (!this.backgroundMapColorView) {
      this.backgroundMapColorView = new cdb.admin.BackgroundMapColorView({ model: this.model.getBaseLayer(), map: this.model});
    }

    this.addView(this.backgroundMapColorView);
    this.$el.append(this.backgroundMapColorView.render().el);
    this.backgroundMapColorView.delegateEvents();

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

    this.cleanTooltips();

    return this;
  },


  /**
  * Checks every subview and mark as selected if necesary
  * @method markSelectedLayer
  */
  markSelectedLayer: function() {
    for(var cid in this._subviews) {
      this._subviews[cid].checkIfSelected();
    }
  }

});
