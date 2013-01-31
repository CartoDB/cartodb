


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
  //cdb.log.debug("added base layer option: " + lyr.get('urlTemplate'));

  this.addView(v);

  var
  element  = v.render().el,
  $element = $(element);

  this.$el.append(element);

  if (!$element.attr('data-tipsy')) {
    $element.attr('data-tipsy', 'your basemap')
  }

},

_addGoogleMaps: function() {
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
    var base = new cdb.admin.GMapsBaseLayer({ base_type: layer_name, className: "default " + layer_name, style: styles[layer_name], name: names[layer_name] });

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

