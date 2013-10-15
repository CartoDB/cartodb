
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
    this.$el.parents('.dropdown.basemap').find('li.selected').removeClass('selected');
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
    var $e = $("<div class='thumb'></div> <div class='name'>" + this.model.get("name") + "</div>" );
    var $a = this.make("a", {"class": this.model.get('base_type') }, $e);
    this.$el.html($a);
    this.elder('render');
    return this;
  },

  activate: function(e) {
    e.preventDefault();
    cdb.god.trigger("closeDialogs");

    this.map.changeProvider('googlemaps', this.model.clone());
    return false;
  }
});

/**
*  Layers based on Leaflet
*/
cdb.admin.BaseMapView = cdb.admin.BaseLayerButton.extend({

  events: {
    'click .remove_layer': '_openDropdown',
    'click': 'activate'
  },

  defaults: {
    // subdomain by default 'a'
    s: 'a',
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
    var back_tile = this.model.get("urlTemplate")
    .replace("{s}", this.options.s)
    .replace("{z}", this.options.z)
    .replace("{x}", this.options.x)
    .replace("{y}", this.options.y);

    var $e = $("<div class='thumb' style='background-image:url(" + back_tile + ")'></div> <div class='name'>" + this.model.get("name") + "</div>" );
    var $a = $(this.make("a", { "class": this.model.get('className') }, $e));

    if (!this.model.get('read_only')) {
      del = this.make("span", {"class": "remove_layer"});
      $a.find(".thumb").append(del);
    }

    this.$el.html($a);
    this.$el.attr('data-tipsy', this.model.get("name"));
    this.$el.attr("title", this.model.get("name"));

    var self = this;

    this.elder('render');
    return this;
  },


  activate: function(e) {
    e.preventDefault();
    e.stopPropagation();
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
    ev.stopImmediatePropagation();

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
    });

    this.dropdown.bind("optionClicked", function(ev) {
      ev.preventDefault();
      self.model.destroy();
    });

    $('body').append(this.dropdown.render().el);
    this.dropdown.open(ev);
    cdb.god.bind("closeDialogs", this.dropdown.hide, this.dropdown);

    return false;
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
    _.bindAll(this, 'setColor', 'setPattern');

    this.map = this.options.map;
    this.current_color = '#FFFFFF';
    this.current_pattern_url = '';
    this.bindMap(this.map);
  },


  render: function() {
    var self = this;

    if (this.current_pattern_url) {
      this.$el.append("<a href='#change_background' class='button plain'>"
                      + "<div class='thumb' style='background-image:url(" + this.current_pattern_url + ")'></div>"
                      + "<div class='name'>Image pattern</div>"
                      + "</a>");
    } else {
      this.$el.append("<a href='#change_background' class='button plain'>"
                      + "<div class='thumb' style='background-color:" + this.current_color + "'></div>"
                      + "<div class='name'>Color: " + this.current_color + "</div>"
                      + "</a>");

    }

    this.$el.addClass("map_background");

    this.$el.attr('title', 'click to change the map background color');

    this._initPicker();
    this.elder('render');

    return this;
  },

  activate: function() {

    var lyr = new cdb.admin.PlainLayer({
      color: this.current_color,
      image: this.current_pattern_url,
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
      target: this.$el,
      vertical_position: "down",
      horizontal_position: "left",
      vertical_offset: 53,
      horizontal_offset: 156,
      tick: "top",
      imagePicker: true,
      kind: "pattern",
    }).bind("colorChosen", this.setColor)
    .bind("fileChosen", this.setPattern);

  },

  updatePatternButton: function(url) {
    this.$el.find(".thumb").css({ "background-image": "url(" + url + ")" })
    this.$el.find(".name").text("Image pattern");
  },

  updateColorButton: function(color) {
    this.$el.find(".thumb").css({ "background": color })
    this.$el.find(".name").text("Color: " + color);
  },

  setPattern: function(url) {

    cdb.god.trigger("closeDialogs");

    // Put new url
    this.updatePatternButton(url);

    $(".options .basemap_dropdown .map_background .info strong").text("Image pattern");
    $(".options .basemap_dropdown .map_background .thumb").css("background-image", "url(" + url + ")");
    $(".options .basemap_dropdown .map_background .thumb").css("background-color", "transparent");

    this.model.set("image", url);

    // Set new model
    this.current_pattern_url = url;
    this.current_color = "#FFFFFF";
    this.activate();
  },

  setColor: function(color) {

    cdb.god.trigger("closeDialogs");

    // Put new color
    this.updateColorButton(color);

    $(".options .basemap_dropdown .map_background .info strong").text("Color: " + color);
    $(".options .basemap_dropdown .map_background .thumb").css("background-color", color);

    // Set new model
    this.current_color = color;
    this.current_pattern_url = '';
    this.activate();
  },

  _openPicker: function(ev) {

    ev.preventDefault();
    ev.stopImmediatePropagation();

    cdb.god.unbind("closeDialogs", this.color_picker.hide, this.color_picker);

    if (!this.color_picker.el.parentElement) {

      $('body').append(this.color_picker.render().el);

      this.color_picker.init(this.model.get('color') || "#FFFFFF");

      cdb.god.bind("closeDialogs", this.color_picker.hide, this.color_picker);
    } else {
      this.color_picker.hide();
    }

  },

  selectButton: function() {

    if (this.model.get('image')) this.updatePatternButton(this.model.get('image'));
    else if (this.model.get('color')) this.updateColorButton(this.model.get('color'));

    this.$el.parents('.dropdown.basemap').find('li.selected').removeClass('selected');
    this.$el.addClass('selected');
  }
});

/**
* User options dropdown (extends Dropdown)
*
* It shows the content in a dropdown (or dropup) with a special effect.
*
* Usage example:
*
var user_menu = new cdb.admin.DropdownBasemap({
target: $('a.account'),
model: {username: username}, // No necessary indeed
template_base: 'common/views/settings_item'
});
*
*/

cdb.admin.DropdownBasemap = cdb.ui.common.Dropdown.extend({

  className: 'dropdown basemap',

  defaults: {
    basemaps_per_list: 4
  },

  events: {
    "click a.add" : "_openSelector"
  },

  initialize: function() {
    _.bindAll(this, "add", "setActiveBaselayer", "open", "hide", "_handleClick", "_keydown");

    // Extend options
    _.defaults(this.options, this.default_options);

    // Dropdown template
    this.template_base = cdb.templates.getTemplate(this.options.template_base);

    // Bind to target
    $(this.options.target).bind({"click": this._handleClick});

    // Bind ESC key
    $(document).bind('keydown', this._keydown);

    // Is open flag
    this.isOpen = false;

    this.baseLayers = this.options.baseLayers;

    if (this.baseLayers) {
      this.baseLayers.bind('reset', this.render, this);
      this.baseLayers.bind('add',   this.add,    this);
    }

    // Bind any change of mapview to base chooser
    var self = this;
    this.options.mapview.bind('newLayerView', function(a) {
      self._checkPlainColor();
      self.setActiveBaselayer(a);
    });

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

  _toggleAddBaseLayer: function() {

    var
    $add = this.$el.find(".add_basemap"),
    $ul  = this.$el.find("ul.special");

    //if ($ul.height() < $ul.parent().height()) $ul.css("height", $ul.parent().height());

    if ($ul.find("li").length <= this.defaults.basemaps_per_list) {
      $add.removeClass("hidden");
      $add.parent().append($add);

    } else {
      $add.addClass("hidden");
    }

    this._recalcHeight();
  },

  _recalcHeight: function() {

    var $ul  = this.$el.find("ul.special");

    // Resets heights
    $ul.height("auto");
    $ul.parent().height("auto");

    var special_height  = $ul.height();
    var dropdown_height = $ul.parent().height();

    // Sets heights
    if (special_height < dropdown_height) $ul.css("height", dropdown_height);
    else $ul.parent().height(special_height);

   },

  add: function(lyr) {

    var self = this;

    if (!lyr.get("urlTemplate")) return;

    var v = new cdb.admin.BaseMapView({ model: lyr, map: this.model });

    lyr.bind("destroy", self._toggleAddBaseLayer, this);

    this.addView(v);

    var name = v.model.get("name");

    if (!name) {
      name = "Custom basemap " + v.model.get("order");
    } else {
      name.replace(/_/g, "");
    }

    v.model.set("name", name);

    var
    element  = v.render().el,
    $element = $(element);

    if (!$element.find("a").hasClass("default")) this._appendUserBaseLayerButton($element);
    else this._appendDefaultBaseLayerButton($element);

    this._toggleAddBaseLayer();

  },

  _appendUserBaseLayerButton: function($element) {

    var $ul = this.$el.find('ul.special');
    $ul.append($element);
  },

  _appendDefaultBaseLayerButton: function($element) {

    var $ul = this.$el.find('.custom ul:last-child');

    if ($ul.length <= 0 || ($ul.length > 0 && $ul.find("li").length >= this.defaults.basemaps_per_list)) {
      var $ul = $("<ul></ul>");
      this.$el.find(".custom").append($ul);
    }

    $ul.append($element);

  },

  _updateTarget: function(className) {
    if (className) {
      className = className.replace(/default/g, '').replace(/\s+/g, '');
    }

    var $el  = this.$el.find("a." + className);

    var name = $($el.find(".name")[0]).text();

    // Thanks Firefox
    var bkg  = $el.find(".thumb").css("background-image");
    var pos  = $el.find(".thumb").css("background-position");
    var size = $el.find(".thumb").css("background-size");
    var color = $el.find(".thumb").css("background-color");

    var $target = this.options.target;

    $target.find(".info .name").html(name);

    $target.find("a.thumb").css({
      "background-image": bkg,
      "background-position": pos,
      "background-size": size,
      "background-color": color
    });
  },

  _addBackgroundView: function() {
    this.backgroundMapColorView = new cdb.admin.BackgroundMapColorView({ model: this.model.getBaseLayer(), map: this.model });
    this.addView(this.backgroundMapColorView);
    var $view = $(this.backgroundMapColorView.render().el);
    this._appendDefaultBaseLayerButton($view);

    this.backgroundMapColorView.delegateEvents();
  },

  _addAddlink: function() {
    var $a = $('<li class="add_basemap hidden"><a class="add small" href="#add_basemap"><div class="thumb"></div> <div class="name">Add yours</div></a></li>');
    this._appendUserBaseLayerButton($a);
  },

  show: function() {

    var dfd = $.Deferred();
    var self = this;

    //sometimes this dialog is child of a node that is removed
    //for that reason we link again DOM events just in case
    this.delegateEvents();
    this.$el
    .css({
      marginTop: self.options.vertical_position == "down" ? "-10px" : "10px",
      opacity:0,
      display:"block"
    })
    .animate({
      margin: "0",
      opacity: 1
    }, {
      "duration": this.options.speedIn,
      "complete": function(){
        dfd.resolve();
      }
    });

    this.trigger("onDropdownShown", this.el);
    this._toggleAddBaseLayer();

    return dfd.promise();
  },

  open: function(ev,target) {

    // Target
    var $target = target && $(target) || this.options.target;
    this.options.target = $target;

    this.$el.css({
      top: 55,
      left: this.options.horizontal_offset
    })
    .addClass(
      // Add vertical and horizontal position class
      (this.options.vertical_position == "up" ? "vertical_top" : "vertical_bottom" )
      + " " +
        (this.options.horizontal_position == "right" ? "horizontal_right" : "horizontal_left" )
      + " " +
        // Add tick class
        "border tick_" + this.options.tick
    )

    // Show it
    this.show();
    this._recalcHeight();

    // Dropdown open
    this.isOpen = true;
  },

  hide: function(done) {

    if (!this.isOpen) {
      done && done();
      return;
    }

    var self    = this;
    this.isOpen = false;

    this.$el.animate({
      marginTop: self.options.vertical_position == "down" ? "10px" : "-10px",
      opacity: 0
    }, this.options.speedOut, function(){

      // And hide it
      self.$el.hide();

    });

    this.trigger("onDropdownHidden",this.el);
  },

  _addBaseDefault: function() {
    this.baseLayers.each(this.add);
  },

  _addGoogleMaps: function() {
    var self = this;

    var
      available = ['roadmap', 'terrain', 'satellite', 'hybrid', 'gray_roadmap', 'dark_roadmap'],

      names = {
        roadmap:      "GMaps Roadmap",
        terrain:      "GMaps Terrain",
        hybrid:       "GMaps Hybrid",
        satellite:    "GMaps Satellite",
        gray_roadmap: "GMaps Gray Roadmap",
        dark_roadmap: "GMaps Dark"
      },

      styles = {
        roadmap:      [],
        terrain:      [],
        satellite:    [],
        hybrid:       [],
        gray_roadmap: [ { stylers: [ { "saturation": -100 } ] },{ "featureType": "water", "stylers": [ { "gamma": 1.67 }, { "lightness": 27 } ] },{ "elementType": "geometry", "stylers": [ { "gamma": 1.31 }, { "lightness": 12 } ] },{ "featureType": "administrative", "elementType": "labels", "stylers": [ { "lightness": 51 }, { "gamma": 0.94 } ] },{ },{ "featureType": "road", "elementType": "labels", "stylers": [ { "lightness": 57 } ] },{ "featureType": "poi", "elementType": "labels", "stylers": [ { "lightness": 42 } ] } ],
        dark_roadmap: [ { featureType: "landscape.natural", stylers: [ { gamma: 0.01 }, { weight: 0.1 } ] }, { stylers: [ { saturation: -100 }, { invert_lightness: true }, { gamma: 4.17 }, { lightness: -87 } ] }, { elementType: "labels", stylers: [ { visibility: "on" }, { lightness: 3 }, { gamma: 1.85 } ] }, { stylers: [ { weight: 1.2 } ] },{ featureType: "road.highway", stylers: [ { visibility: "simplified" }, { weight: 0.3 } ] }, { elementType: "labels.icon", stylers: [ { visibility: "off" } ] }, { featureType: "road.arterial", stylers: [ { weight: 0.3 } ] }, { featureType: "administrative.neighborhood", stylers: [ { visibility: "off" } ] }, { featureType: "administrative.locality", stylers: [ { visibility: "off" } ] }, { featureType: "poi", elementType: "labels", stylers: [ { visibility: "off" } ] },{ featureType: "poi", stylers: [ { lightness: 4 } ] },{ featureType: "administrative", stylers: [ { lightness: 14 }, { weight: 0.8 } ] },{ featureType: "landscape.man_made", stylers: [ { lightness: 13 } ] },{ featureType: "road.local", stylers: [ { weight: 0.2 } ] },{ featureType: "road.highway", stylers: [ { weight: 0.3 } ] }]
      };

    for (var i in available) {

      var layer_name = available[i];
      var base = new cdb.admin.GMapsBaseLayer({ base_type: layer_name, className: layer_name, style: styles[layer_name], name: names[layer_name] });

      var v = new cdb.admin.GMapsBaseView({
        model: base,
        map: this.model
      });

      this.addView(v);

      var $view = $(v.render().el);
      $view.attr("title", names[layer_name]);

      // Update the target title and icon
      $view.find("a").addClass("default");

      this._appendDefaultBaseLayerButton($view);
    }

  },

  /**
  *  When a new base layer is activated,
  *  we apply the select to the correct base layer button
  */
  setActiveBaselayer: function(layer) {

    for (var sv in this._subviews) {

      var subview = this._subviews[sv];

      if (subview.model &&
        this.model.getBaseLayer &&
        this.model.getBaseLayer().isEqual(subview.model)) {

          subview.selectButton();

          var className = subview.model.get("className");

          this._updateTarget(className);

          return;

        }
    }

  },

  /*
   * Creates a modal dialog to let the user create a new basemap
   */
  _openSelector: function(ev) {

    var self = this;

    ev.preventDefault();

    var layer_ids = _.map(self.$el.find(".special li a"), function(a) { return $(a).attr("class"); });

    var dialog = new cdb.admin.BaseMapAdder({
      model: this.model, //map
      baseLayers: this.baseLayers,
      layer_ids: layer_ids,
      ok: function(layer) {
        self.model.changeProvider('leaflet', layer.clone());
      }
    });

    dialog.appendToBody().open();

    return false;
  },

  /*
   * Renders the basemap dropdown
   */
  render: function() {

    this.clearSubViews();

    var self = this;

    self.$el.html(self.template_base(self.options));

    self._addBaseDefault();
    self._addGoogleMaps();
    self._addBackgroundView();
    self._addAddlink();

    return this;
  }

});
