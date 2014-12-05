
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
    this.mapView.bind('click zoomstart drag', function() {
      this.dropdown && this.dropdown.hide()
    }, this);
    this.add_related_model(this.mapView);

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
    this.layers = [];

    _.each(this.map.layers.models, function(layer) {

      if (layer.get("type") == 'layergroup' || layer.get('type') === 'namedmap') {
        var layerGroupView = self.mapView.getLayerByCid(layer.cid);
        for (var i = 0 ; i < layerGroupView.getLayerCount(); ++i) {
          var l = layerGroupView.getLayer(i);
          var m = new cdb.core.Model(l);
          m.set('order', i);
          m.set('type', 'layergroup');

          m.set('visible', !layerGroupView.getSubLayer(i).get('hidden'));
          m.bind('change:visible', function(model) {
            this.trigger("change:visible", model.get('visible'), model.get('order'), model);
          }, self);

          if(self.options.layer_names) {
            m.set('layer_name', self.options.layer_names[i]);
          } else {
            m.set('layer_name', l.options.layer_name);
          }

          var layerView = self._createLayer('LayerViewFromLayerGroup', {
            model: m,
            layerView: layerGroupView,
            layerIndex: i
          });
          layerView.bind('switchChanged', self._setCount, self);
          self.layers.push(layerView);
        }
      } else if (layer.get("type") === "CartoDB" || layer.get('type') === 'torque') {
        var layerView = self._createLayer('LayerView', { model: layer });
        layerView.bind('switchChanged', self._setCount, self);
        self.layers.push(layerView);
        layerView.model.bind('change:visible', function(model) {
          this.trigger("change:visible", model.get('visible'), model.get('order'), model);
        }, self);
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
      var lyr = this.layers[i];

      if (lyr.model.get('visible')) {
        count++;
      }
    }

    this.$('.count').text(count);
    this.trigger("switchChanged", this);
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
      <a class="layer" href="#/change-layer"><%= layer_name %></a>\
      <a href="#switch" class="right <%= visible ? "enabled" : "disabled" %> switch"><span class="handle"></span></a>\
    '
  },

  events: {
    "click": '_onSwitchClick'
  },

  initialize: function() {

    if (!this.model.has('visible')) this.model.set('visible', false);

    this.model.bind("change:visible", this._onSwitchSelected, this);

    this.add_related_model(this.model);

    this._onSwitchSelected();

    // Template
    this.template = this.options.template ? cdb.templates.getTemplate(this.options.template) : _.template(this.defaults.template);
  },

  render: function() {
    var attrs = _.clone(this.model.attributes);
    attrs.layer_name = attrs.layer_name || attrs.table_name;
    this.$el.append(this.template(attrs));
    return this;
  },

  /*
  * Throw an event when the user clicks in the switch button
  */
  _onSwitchSelected: function() {
    var enabled = this.model.get('visible');

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
    this.model.set("visible", !this.model.get("visible"));
  }

});

/**
 *  View for each layer from a layer group
 *  - It needs a model and the layer_definition to make it work.
 *
 *  var layerView = new cdb.geo.ui.LayerViewFromLayerGroup({
 *    model: layer_model,
 *    layerView: layweView
 *  });
 *
 */

cdb.geo.ui.LayerViewFromLayerGroup = cdb.geo.ui.LayerView.extend({

  _onSwitchSelected: function() {

    cdb.geo.ui.LayerView.prototype._onSwitchSelected.call(this);
    var sublayer = this.options.layerView.getSubLayer(this.options.layerIndex)
    var visible = this.model.get('visible');

    if (visible) {
      sublayer.show();
    } else {
      sublayer.hide();
    }
  }
});
