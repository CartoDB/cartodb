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
      this.baseLayers.bind('add', this.add, this);
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


  add: function(lyr) {

    var self = this;

    var v = new cdb.admin.BaseMapView({ model: lyr, map: this.model });
    cdb.log.debug("added base layer option: " + lyr.get('urlTemplate'));

    this.addView(v);

    var name = v.model.get("name");
    v.model.set("name", name.replace(/_/g, " "));

    var
    element  = v.render().el,
    $element = $(element);

    // Insert after the last leaflet map
    if (this.$el.find('li.leaflet').length > 0) {
      $element.insertAfter(this.$el.find('li.leaflet').last());
    } else {
      this.$el.find("ul").append(element);
    }

    // Update the target title and icon
    $element.find("a").on("click", function(e) {

      var className = $element.find("a").attr("class");
      self._updateTarget(className);

    });

  },

  _updateTarget: function(className) {

    var $el  = this.$el.find("a." + className);

    var name = $el.find(".name").text();
    var bkg  = $el.find(".thumb").css("background");

    var $target = this.options.target;

    $target.find(".info .name").html(name);
    $target.find("a.thumb").css("background", bkg);

  },

  _addBackgroundView: function() {

    var self = this;

    if (!this.backgroundMapColorView) {
      this.backgroundMapColorView = new cdb.admin.BackgroundMapColorView({ model: this.model.getBaseLayer(), map: this.model });
    }

    this.addView(this.backgroundMapColorView);

    var $view = $(this.backgroundMapColorView.render().el);

    // Insert before add_new button
    this.$el.find("ul").append($view);

    this.backgroundMapColorView.delegateEvents();

  },

  _addAddlink: function() {

    var $a = $('<li><a class="add small" href="#add_basemap"><div class="thumb"></div> <div class="name">Add basemap</div></a></li>');
    this.$el.find("ul").append($a);

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

    this.trigger("onDropdownShown",this.el);

    return dfd.promise();
  },

  open: function(ev,target) {

    // Target
    var $target = target && $(target) || this.options.target;
    this.options.target = $target;

    // Positionate
    var targetPos   = $target[this.options.position || 'offset']()
    , targetWidth   = $target.outerWidth()
    , targetHeight  = $target.outerHeight()
    , elementWidth  = this.$el.outerWidth()
    , elementHeight = this.$el.outerHeight()
    , self = this;

    this.$el.css({
      top: 55,
      left: targetWidth - elementWidth + 53
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

    // Dropdown open
    this.isOpen = true;
  },

  /**
  * open the dialog at x, y
  */
  openAt: function(x, y) {
    var dfd = $.Deferred();

    this.$el.css({
      top: y,
      left: x,
      width: this.options.width
    })
    .addClass(
      (this.options.vertical_position == "up" ? "vertical_top" : "vertical_bottom" )
      + " " +
        (this.options.horizontal_position == "right" ? "horizontal_right" : "horizontal_left" )
      + " " +
        // Add tick class
        "tick_" + this.options.tick
    )

    this.isOpen = true;

    // Show
    $.when(this.show()).done(function(){ dfd.resolve();})
    // xabel: I've add the deferred to make it easily testable

    return dfd.promise();
  },


  hide: function(done) {

    if (!this.isOpen) return;

    var self    = this;
    this.isOpen = false;

    this.$el.animate({
      marginTop: self.options.vertical_position == "down" ? "10px" : "-10px",
      opacity: 0
    }, this.options.speedOut, function(){

      // Remove selected class
      //$(self.options.target).removeClass("selected");

      // And hide it
      self.$el.hide();
      done && done();

    });

    this.trigger("onDropdownHidden",this.el);
  },

_addBaseDefault: function() {
  this.baseLayers.each(this.add);
},

_addGoogleMaps: function() {
  var self = this;

  var
  available = ['satellite', 'hybrid', 'gray_roadmap'],
  names = {
    roadmap:      "GMaps Roadmap",
    hybrid:       "GMaps Hybrid",
    satellite:    "GMaps Satellite",
    gray_roadmap: "GMaps Gray Roadmap"
  },
  styles = {
    roadmap: [],
    satellite: [],
    hybrid: [],
    gray_roadmap: [ { stylers: [ { saturation: -65 }, { gamma: 1.52 } ] },{ featureType: "administrative", stylers: [ { saturation: -95 }, { gamma: 2.26 } ] },{ featureType: "water", elementType: "labels", stylers: [ { visibility: "off" } ] },{ featureType: "administrative.locality", stylers: [ { visibility: "off" } ] },{ featureType: "road", stylers: [ { visibility: "simplified" }, { saturation: -99 }, { gamma: 2.22 } ] },{ featureType: "poi", elementType: "labels", stylers: [ { visibility: "off" } ] },{ featureType: "road.arterial", stylers: [ { visibility: "off" } ] },{ featureType: "road.local", elementType: "labels", stylers: [ { visibility: "off" } ] },{ featureType: "transit", stylers: [ { visibility: "off" } ] },{ featureType: "road", elementType: "labels", stylers: [ { visibility: "off" } ] },{ featureType: "poi", stylers: [ { saturation: -55 } ] } ]
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
    this.$el.find("ul").append($view);

    // Update the target title and icon
    $view.find("a").on("click", function(e) {
      var className = $(this).attr("class");
      self._updateTarget(className);
    });

  }

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

        var baselayer = this.model.getBaseLayer();

        this._updateTarget(baselayer.get("className"));

        return;
      }
  }
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

render: function() {
  var $el = this.$el;

  $el
  .html(this.template_base(this.options))
  .css({
    width: this.options.width
  });

  this._addBaseDefault();
  this._addGoogleMaps();
  this._addBackgroundView();

  this._addAddlink();

  return this;
},

});


