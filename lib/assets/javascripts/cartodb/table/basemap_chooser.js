
/**
 *  Base layer button View that applies the correct layer to the map
 */
cdb.admin.BaseLayerButton = cdb.core.View.extend({

  bindMap: function(map) {
    map.bind('savingLayers', this.disable, this);
    map.bind('savingLayersFinish', this.enable, this);
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
    this.$el.parents('.base_maps').find('li.selected').removeClass('selected');
    this.$el.addClass('selected');
  }
});

/**
 *  Layers based on Google Maps v3  
 */
cdb.admin.GMapsBaseView = cdb.admin.BaseLayerButton.extend({

  events: {
    'click': 'activate'
  },

  tagName: 'li',
  className: 'gmaps',

  initialize: function() {
    this.options = _.defaults(this.options,this.defaults);
    this.map = this.options.map;

    this.bindMap(this.map);
  },

  render: function() {
    var a = this.make("a", {"class": this.model.get('base_type') }, this.cid);
    this.$el.html(a);
    this.elder('render');
    return this;
  },

  activate: function(e) {
    e.preventDefault();
    this.map.changeProvider('googlemaps', this.model.clone());
    return false;
  }
});

/**
 *  Layers based on Leaflet
 */
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
  className: 'leaflet',

  initialize: function() {
    this.options = _.defaults(this.options,this.defaults);
    this.map = this.options.map;
    this.model.bind('destroy', this.clean, this);
    this.bindMap(this.map);
  },

  render: function() {
    //TODO: move this to model
    var back_tile = this.model.get("urlTemplate").replace("{z}", this.options.z).replace("{x}", this.options.x).replace("{y}", this.options.y)
    , a = this.make("a", {"class": this.model.get('className'), "style": "background-image:url(" + back_tile + ");"}, this.cid);

    if(!this.model.get('read_only')) {
      del = this.make("span", {"class": "remove_layer"});
      $(a).append(del);
    }

    this.$el.html(a);
    this.$el.attr('data-tipsy', this.model.get("name"));
    this.$el.attr("title", this.model.get("name"));

    var self = this;

    this.elder('render');
    return this;
  },

  activate: function(e) {
    e.preventDefault();
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
      className: 'dropdown border short',
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

/**
 *  Color Base layer
 */
cdb.admin.BackgroundMapColorView = cdb.admin.BaseLayerButton.extend({

  events: {
    'click': '_openPicker'
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
    var self = this;

    this.$el.append("<a href='#change_background' class='plain' style='background:"
      + this.current_color + "'><span class='color'>"
    + this.current_color + "</span><span class='button'></span></a>");

    this.$el.addClass("map_background");

    this.$el.attr('title', 'click to change the map background color');

    this._initPicker();
    this.elder('render');

    return this;
  },

  activate: function() {

    var lyr = new cdb.admin.PlainLayer({
      color: this.current_color,
      maxZoom: 28 //allow the user to zoom to the atom
    });

    this.model = lyr;

    this.map.changeProvider('leaflet', lyr);

    return false;
  },

  _initPicker: function() {
    var self = this;

    this.color_picker = new cdb.admin.ColorPicker({
      className: 'dropdown color_picker border vertical_offset',
      target: this.$el.find("span.color"),
      template_base: 'common/views/color_picker',
      vertical_position: "down",
      horizontal_position: "left",
      horizontal_offset: 33,
      tick: "left"
    }).bind("colorChosen", this.setColor);

  },

  updateColorButton: function(color) {
    this.$el.find("a").css({ "background": color })
    this.$el.find("span.color").text(color);
  },

  setColor: function(color) {
    // Put new color
    this.updateColorButton(color);

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

  },

  selectButton: function() {
    this.updateColorButton(this.model.get('color'));
    this.$el.parents('.base_maps').find('li.selected').removeClass('selected');
    this.$el.addClass('selected');
  }
});



/**
 *  Base Layer Chooser View
 */
cdb.admin.BaseMapChooser = cdb.core.View.extend({

  tagName: 'ul',

  events: {
    "click a.add" : "_openSelector"
  },

  initialize: function() {
    _.bindAll(this, 'add', 'setActiveBaselayer');
    this.baseLayers = this.options.baseLayers;
    this.baseLayers.bind('reset', this.render, this);
    this.baseLayers.bind('add', this.add, this);

    // Bind any change of mapview to base chooser
    var self = this;
    this.options.mapview.bind('newLayerView', function(a) {
      self._checkPlainColor();
      self.setActiveBaselayer(a);
    });

    this.model.unbind('change');
    this.model.unbind('reset');
  },


  /**
   *  Checks if new base layer loaded is a plain color type
   *  If so, it is applied to background map color view as the model
   */
  _checkPlainColor: function() {
    var baselayer = this.model.getBaseLayer();
    if (baselayer && baselayer.get('type') == "Plain") {
      this.backgroundMapColorView.model = baselayer;
    }
  },

  _addBaseDefault: function() {
    this.baseLayers.each(this.add);
  },

  _addSelector: function() {
    var $li = $("<li class='add_new'><a href='#add_new_one' class='add'><span></span></a></li>");
    this.$el.append($li);
    $li.attr('data-tipsy', 'click to add a new layer');
    $li.tipsy({ title:"data-tipsy", fade: true });
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

    // Insert after the last leaflet map
    if (this.$el.find('li.leaflet').length > 0) {
      $element.insertAfter(this.$el.find('li.leaflet').last());
    } else {
      this.$el.append(element);
    }

    if(!$element.attr('data-tipsy')) {
      $element.attr('data-tipsy', 'your basemap')
    }
  },

  _addGoogleMaps: function() {
    var
    available = ['satellite', 'hybrid', 'gray_roadmap'],
    names = {
      roadmap:      "Roadmap (GoogleMaps)",
      hybrid:       "Hybrid (GoogleMaps)",
      satellite:    "Satellite (GoogleMaps)",
      gray_roadmap: "Gray Roadmap (GoogleMaps)"
    },
    styles = {
      roadmap: [],
      satellite: [],
      hybrid: [],
      gray_roadmap: [ { stylers: [ { saturation: -65 }, { gamma: 1.52 } ] },{ featureType: "administrative", stylers: [ { saturation: -95 }, { gamma: 2.26 } ] },{ featureType: "water", elementType: "labels", stylers: [ { visibility: "off" } ] },{ featureType: "administrative.locality", stylers: [ { visibility: "off" } ] },{ featureType: "road", stylers: [ { visibility: "simplified" }, { saturation: -99 }, { gamma: 2.22 } ] },{ featureType: "poi", elementType: "labels", stylers: [ { visibility: "off" } ] },{ featureType: "road.arterial", stylers: [ { visibility: "off" } ] },{ featureType: "road.local", elementType: "labels", stylers: [ { visibility: "off" } ] },{ featureType: "transit", stylers: [ { visibility: "off" } ] },{ featureType: "road", elementType: "labels", stylers: [ { visibility: "off" } ] },{ featureType: "poi", stylers: [ { saturation: -55 } ] } ]
    };


    for(var i in available) {
      var layer_name = available[i];
      var base = new cdb.admin.GMapsBaseLayer({ base_type: layer_name, className: layer_name, style: styles[layer_name], name: names[layer_name] });

      var v = new cdb.admin.GMapsBaseView({
        model: base,
        map: this.model
      });
      this.addView(v);
      var $view = $(v.render().el);
      $view.attr("title", names[layer_name]);
      $view.attr("data-tipsy", names[layer_name]);

      this.$el.append($view);
    }

  },

  _addBackgroundView: function() {
    if (!this.backgroundMapColorView) {
      this.backgroundMapColorView = new cdb.admin.BackgroundMapColorView({ model: this.model.getBaseLayer(), map: this.model});
    }

    this.addView(this.backgroundMapColorView);
    // Insert before add_new button
    this.$el.append(this.backgroundMapColorView.render().el)
    this.backgroundMapColorView.delegateEvents();    
  },

  render: function() {
    this.$el.html('');
    // Draw default layers
    this._addBaseDefault();

    // Add google maps views
    this._addGoogleMaps();

    // Add background map selector
    this._addBackgroundView();

    // Add tile button selector
    this._addSelector();

    this.$el.find('li.map_background').attr('data-tipsy', 'click to change the background color');

    var j = 0;
    var gravity = "s";

    this.$el.find('li').map(function(e, i) {
      var $li = $(i);

      if (!$li.attr('data-tipsy')) {
        $li.attr('data-tipsy', 'click to change the base layer');
      }

      if (j == 0) {
        gravity = "nw";
      } else {
        gravity = "n";
      }

      $li.tipsy({ title: "data-tipsy", fade: true, gravity: gravity });
      j++;
    });

    this.cleanTooltips();
    this.delegateEvents();

    return this;
  },

  /**
   *  When a new base layer is activated,
   *  we apply the select to the correct base layer button
   */
  setActiveBaselayer: function(layer) {
    for (var sv in this._subviews) {
      var subview = this._subviews[sv];
      if(subview.model &&
        this.model.getBaseLayer &&
        this.model.getBaseLayer().isEqual(subview.model)){
          subview.selectButton();
          return;
        }
    }
  }
});
