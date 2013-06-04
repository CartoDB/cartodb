/**
* Model for the Layer collection
*/
cdb.geo.ui.Layer = cdb.core.Model.extend({

  defaults: {
    visible: true
  }

});

/**
* View for each one of the layers
*/
cdb.geo.ui.LayerView = cdb.core.View.extend({

  tagName: "li",

  defaults: {
    template: '<a class="layer" href="#"><%= options.layer_name %></a> <a href="#switch" class="right enabled switch"><span class="handle"></span></a>'
  },

  events: {
    "click": '_onSwitchClick'
  },

  initialize: function() {

    this.add_related_model(this.model);

    this.model.bind("change:visible", this._onSwitchSelected, this);

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

    var enabled = this.model.get('visible');

    this.$el.find(".switch")
    .removeClass(enabled ? 'disabled' : 'enabled')
    .addClass(enabled    ? 'enabled'  : 'disabled');

  },

  _onSwitchClick: function(e){

    e.preventDefault();
    e.stopPropagation();

    this.model.set("visible", !this.model.get("visible"));
  }

});

/**
* Collection of layers
*/
cdb.geo.ui.Layers = Backbone.Collection.extend({
  model: cdb.geo.ui.Layer
});

/**
* Layer selector: it allows to select the layers that will be shown in the map
*/
cdb.geo.ui.LayerSelector = cdb.core.View.extend({

  className: 'cartodb-layer-selector-box',

  events: {
    "click":     '_openDropdown',
    "dblclick":  '_stopPropagation',
    "mousedown": '_stopPropagation'
  },

  initialize: function() {

    _.bindAll(this, "switchChanged");

    this.map           = this.options.map;
    this.layers        = this.map.layers;
    this.cartoDBLayers = this._getCartoDBLayers();

    this.model = new cdb.core.Model({
      count: this.cartoDBLayers.length
    });

    this.model.bind("change:count", this._onCountChange, this);
  },

  _getCartoDBGroupLayers: function(layers) {

    return _.map(layers, function(layer) {
      return (layer.type == 'CartoDB') && new cdb.geo.CartoDBLayer(layer);
    });

  },

  _getCartoDBLayers: function() {

    var self = this;
    var layers = [];

    _.each(this.layers.models, function(layer) {
      if (layer.get("type") == 'CartoDB') {
        layers.push(layer);
      } else if (layer.get("type") == 'layergroup') {
        var  group = self._getCartoDBGroupLayers(layer.get("layer_definition").layers);
        layers.push(group);
      }
    });

    return _.flatten(layers);

  },

  render: function() {

    this.$el.html(this.options.template(_.extend(this.model.toJSON(), this.options)));

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

    this._createLayers();

    return this;

  },

  _createLayers: function() {

    var self = this;

    _.each(this.cartoDBLayers, function(layer) {

      layer.bind("change:visible", self.switchChanged, this);

      var layerView = new cdb.geo.ui.LayerView({
        model: layer,
        template_base: 'table/views/layer_item'
      });

      self.$("ul").append(layerView.render().el);
    });
  },

  switchChanged: function(layer) {
    // Set visible
    // ...

    // var layers = layer.collection.filter(function(layer) {
    //   return layer.get("visible") && layer.get("type") == 'CartoDB'
    // });

    // Set new count
    // this.model.set("count", layers.length);
  },

  _onCountChange: function() {
    this.$el.find(".count").html(this.model.get("count"));
  },

  _stopPropagation: function(e) {
    e.preventDefault();
    e.stopPropagation();
  },

  _openDropdown: function() {
    this.dropdown.open();
  }

});
