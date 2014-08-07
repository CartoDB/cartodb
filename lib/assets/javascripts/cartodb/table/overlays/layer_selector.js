cdb.admin.overlays.LayerSelector = cdb.core.View.extend({

  tagName: 'div',
  className: 'cartodb-layer-selector-box',

  events: {
    "click":     '_openDropdown',
    "dblclick":  'killEvent',
    "mousedown": 'killEvent'
  },

  default_options: {
    timeout: 0,
    msg: ''
  },

  initialize: function() {

    _.bindAll(this, "_close");

    this.map      = this.options.mapView.map;
    this.mapView  = this.options.mapView;

    this.mapView.bind('click zoomstart drag', function() {
      this.dropdown && this.dropdown.hide()
    }, this);

    this.add_related_model(this.mapView);

    this.layers = [];

    this.map = this.options.map;

    _.defaults(this.options, this.default_options);

    this._setupModels();

  },

  _killEvent: function(e) {

    e && e.preventDefault();
    e && e.stopPropagation();

  },

  // Setup the internal and custom model
  _setupModels: function() {

    this.model = this.options.model;

    this.model.on("change:display", this._onChangeDisplay, this);
    this.model.on("change:y",       this._onChangeY, this);
    this.model.on("change:x",       this._onChangeX, this);

    this.model.on("destroy", function() {
      this.$el.remove();
    }, this);

  },

  _onChangeX: function() {

    var x = this.model.get("x");
    this.$el.animate({ right: x }, 150);

    this.trigger("change_x", this);

    //this.model.save();

  },

  _onChangeY: function() {

    var y = this.model.get("y");
    this.$el.animate({ top: y }, 150);

    this.trigger("change_y", this);

    //this.model.save();

  },

  _onChangeDisplay: function() {

    var display = this.model.get("display");

    if (display) {
      this.show();
    } else {
      this.hide();
    }

  },

  _checkZoom: function() {
    var zoom = this.map.get('zoom');
    this.$('.zoom_in')[ zoom < this.map.get('maxZoom') ? 'removeClass' : 'addClass' ]('disabled')
    this.$('.zoom_out')[ zoom > this.map.get('minZoom') ? 'removeClass' : 'addClass' ]('disabled')
  },

  zoom_in: function(ev) {
    if (this.map.get("maxZoom") > this.map.getZoom()) {
      this.map.setZoom(this.map.getZoom() + 1);
    }
    ev.preventDefault();
    ev.stopPropagation();
  },

  zoom_out: function(ev) {
    if (this.map.get("minZoom") < this.map.getZoom()) {
      this.map.setZoom(this.map.getZoom() - 1);
    }
    ev.preventDefault();
    ev.stopPropagation();
  },

  _onMouseDown:      function() { },
  _onMouseEnterText: function() { },
  _onMouseLeaveText: function() { },
  _onMouseEnter:     function() { },
  _onMouseLeave:     function() { },

  show: function() {

    this.$el.fadeIn(250);

  },

  hide: function(callback) {

    var self = this;

    callback && callback();

    this.$el.fadeOut(250);

  },

  _close: function(e) {

    this._killEvent(e);

    var self = this;

    this.hide(function() {
      self.trigger("remove", self);
    });

  },

  _toggleFullScreen: function(ev) {

    ev.stopPropagation();
    ev.preventDefault();

    var doc   = window.document;
    var docEl = doc.documentElement;

    if (this.options.doc) { // we use a custom element
      docEl = $(this.options.doc)[0];
    }

    var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen;
    var cancelFullScreen  = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen;

    var mapView = this.options.mapView;

    if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement) {

      requestFullScreen.call(docEl);

      if (mapView) {

        if (this.model.get("allowWheelOnFullscreen")) {
          mapView.options.map.set("scrollwheel", true);
        }

      }

    } else {

      cancelFullScreen.call(doc);

    }
  },

  _getLayers: function() {
    var self = this;
    this.layers = [];

    _.each(this.mapView.map.layers.models, function(layer) {

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
            model.save();

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
          model.save();

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
  },

  render: function() {

    var self = this;

    this.$el.html(this.options.template(this.options));

    this.$el.css({ right: this.model.get("x"), top: this.model.get("y") });

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
  }

});
