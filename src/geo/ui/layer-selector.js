var _ = require('underscore');
var cdb = require('cdb'); // cdb.god, cdb.geo.ui.*
var Dropdown = require('../../ui/common/dropdown');
var View = require('../../core/view');
var Model = require('../../core/model');
var LayerView = require('./layer-view');

/**
 *  Layer selector: it allows to select the layers that will be shown in the map
 *  - It needs the mapview, the element template and the dropdown template
 *
 *  var layer_selector = new LayerSelector({
 *    mapView: mapView,
 *    template: element_template,
 *    dropdown_template: dropdown_template
 *  });
 */
var LayerSelector = View.extend({

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
      this.dropdown && this.dropdown.hide();
    }, this);
    this.add_related_model(this.mapView);

    this.layers = [];
  },

  render: function() {

    this.$el.html(this.options.template(this.options));

    this.dropdown = new Dropdown({
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

    // TODO cdb.god only exists for cartodb editor, this would be better to extract and handle there
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
        layer.layers.each(function(layerModel, index){

          var layerName = layerModel.getName();
          if(self.options.layer_names) {
            layerName = self.options.layer_names[index];
          }

          var m = new Model({
            order: index,
            visible: layerModel.get('visible') || true,
            layer_name: layerName
          });

          m.bind('change:visible', function(model) {
            this.trigger("change:visible", model.get('visible'), model.get('order'), model);
            layerModel.set('visible', model.get('visible'));
          }, self);

          layerModel.bind('change:visible', function() {
            m.set('visible', layerModel.get('visible'));
          });

          var layerView = self._createLayerView(m);
          layerView.bind('switchChanged', self._setCount, self);
          self.layers.push(layerView);
        })
      } else if (layer.get('type') === 'torque') {
        var layerView = self._createLayerView(layer);
        layerView.bind('switchChanged', self._setCount, self);
        self.layers.push(layerView);
        layerView.model.bind('change:visible', function(model) {
          this.trigger("change:visible", model.get('visible'), model.get('order'), model);
        }, self);
      }

    });
  },

  _createLayerView: function(model) {
    var layerView = new LayerView({
      model: model
    });
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

module.exports = LayerSelector;
