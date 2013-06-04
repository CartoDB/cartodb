
/**
 *  Layer selector: it allows to select the layers that will be shown in the map
 *  - It needs the mapview, the element template and the dropdown template
 *
 *  var layer_selector = new cdb.geo.ui.LayerSelector({
 *    mapView: mapView,
 *    template: element_template,
 *    dropdown_template: dropdown_template
 *  });
 */

cdb.geo.ui.LayerSelector = cdb.core.View.extend({

  className: 'cartodb-layer-selector-box',

  events: {
    "click":     '_openDropdown',
    "dblclick":  'killEvent',
    "mousedown": 'killEvent'
  },

  initialize: function() {
    this.map = this.options.mapView.map;
    this.mapView  = this.options.mapView;
    this.layers = [];
  },

  render: function() {

    this.$el.html(this.options.template(this.options));

    this.dropdown = new cdb.ui.common.Dropdown({
      className:"cartodb-dropdown border",
      template: this.options.dropdown_template,
      target: this.$el.find("a"),
      speedIn: 300,
      speedOut: 200,
      position: "position",
      tick: "right",
      vertical_position: "down",
      horizontal_position: "right",
      vertical_offset: 7,
      horizontal_offset: 13
    });

    if (cdb.god) cdb.god.bind("closeDialogs", this.dropdown.hide, this.dropdown);

    this.$el.append(this.dropdown.render().el);

    this._getLayers();
    this._setCount();

    return this;
  },

  _getLayers: function() {
    var self = this;

    _.each(this.map.layers.models, function(layer) {
      
      if (layer.get("type") == 'layergroup') {
        var layer_definition = self.mapView.getLayerByCid(layer.cid);

        for (var i = 0 ; i < layer_definition.getLayerCount(); ++i) {
          var l = layer_definition.getLayer(i);
          var m = new cdb.core.Model(l);
          m.set('order', i);
          var layerView = self._createLayer('LayerViewFromLayerGroup', { model: m, layer_definition: layer_definition });
          layerView.bind('switchChanged', self._setCount, self);
          self.layers.push(layerView);
        }
      } else if (layer.get("type") == "CartoDB") {
        var layerView = self._createLayer('LayerView', { model: layer });
        layerView.bind('switchChanged', self._setCount, self);
        self.layers.push(layerView);
      }

    });
  },

  _createLayer: function(_class, opts) {
    var layerView = new cdb.geo.ui[_class](opts);
    this.$("ul").append(layerView.render().el);
    this.addView(layerView);
    return layerView;
  },

  _setCount: function() {
    var count = 0;
    for (var i = 0, l = this.layers.length; i < l; ++i) {
      var l = this.layers[i];
      if (l.model.get('active')) {
        count++;
      }
    }

    this.$('.count').text(count);
  },

  _openDropdown: function() {
    this.dropdown.open();
  }

});






/**
 *  View for each CartoDB layer
 *  - It needs a model to make it work.
 *
 *  var layerView = new cdb.geo.ui.LayerView({
 *    model: layer_model,
 *    layer_definition: layer_definition
 *  });
 *  
 */

cdb.geo.ui.LayerView = cdb.core.View.extend({

  tagName: "li",

  defaults: {
    template: '\
      <a class="layer" href="#/change-layer"><%= table_name %></a>\
      <a href="#switch" class="right <%= active ? "enabled" : "enabled" %> switch"><span class="handle"></span></a>\
    '
  },

  events: {
    "click": '_onSwitchClick'
  },

  initialize: function() {

    // Check if it has active parameter set
    if (!this.model.get('active')) this.model.set('active', true);

    this.model.bind("change:active", this._onSwitchSelected, this);

    // Template
    this.template = this.options.template ? cdb.templates.getTemplate(this.options.template) : _.template(this.defaults.template);
  },

  render: function() {
    this.$el.append(this.template(this.model.toJSON()));
    return this;
  },

  /*
  * Throw an event when the user clicks in the switch button
  */
  _onSwitchSelected: function() {
    var enabled = this.model.get('active');

    // Change switch
    this.$el.find(".switch")
      .removeClass(enabled ? 'disabled' : 'enabled')
      .addClass(enabled    ? 'enabled'  : 'disabled');

    // Send trigger
    this.trigger('switchChanged');
  },

  _onSwitchClick: function(e){
    this.killEvent(e);

    // Set model
    this.model.set("active", !this.model.get("active"));
  }

});




/**
 *  View for each layer from a layer group
 *  - It needs a model and the layer_definition to make it work.
 *
 *  var layerView = new cdb.geo.ui.LayerViewFromLayerGroup({
 *    model: layer_model,
 *    layer_definition: layer_definition
 *  });
 *  
 */

cdb.geo.ui.LayerViewFromLayerGroup = cdb.geo.ui.LayerView.extend({

  defaults: {
    template: '\
      <a class="layer" href="#/change-layer"><%= options.layer_name %></a>\
      <a href="#switch" class="right <%= active ? "enabled" : "enabled" %> switch"><span class="handle"></span></a>\
    '
  },

  _onSwitchSelected: function() {
  
    cdb.geo.ui.LayerView.prototype._onSwitchSelected.call(this);    

    // Change layer_definition
    if (this.model.get('active')) {
      this.options.layer_definition.addLayer(this.model.toJSON().options, this.model.get('order'));
    } else {
      this.options.layer_definition.removeLayer(this.model.get('order'));
    }
  }
});