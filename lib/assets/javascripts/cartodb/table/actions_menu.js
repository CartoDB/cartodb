
//
// manage layers, its order and when should be shown or hiden
//
cdb.admin.LayersPanel = cdb.ui.common.TabPane.extend({

  className: 'table_panel',
  animation_time: 300,

  initialize: function() {
    cdb.ui.common.TabPane.prototype.initialize.call(this);

    this.map = this.options.map;
    this.add_related_model(this.map);

    this.map.layers.bind('add', this._addLayer, this);
    this.map.layers.bind('reset', this._resetLayers, this);
    this._addLayers(this.map.layers);

    this.isOpen = true;
    this.activeWorkView = 'table';
  },

  _resetLayers: function() {
    //clean all views
    this.removeTabs();
    this._addLayers(this.map.layers);
  },

  _addLayers: function(layers) {
    var self = this;
    layers.each(function(l) {
      self._addLayer(l)
    });
  },

  _addLayer: function(layer) {
    var self = this;
    if(layer.get('type') == 'CartoDB') {
      var addIt = function(t) {
        var v = new cdb.admin.LayerPanelView({
          model: layer,
          sqlView: self.options.sqlView,
          table: t,
          map: self.map,
          user: self.options.user,
          globalError: self.options.globalError
        });
        v.bind('toggle', self.toggle, self);
        v.bind('switchTo', function(v)  {
          self.active(v.dataLayer.cid);
          self.trigger('switch', v);
        });
        self.addTab(layer.cid, v);
        v.setActiveWorkView(self.activeWorkView);
        self.trigger('switch', v);
      };

      if(layer.get('table_id')) {
        var table = new cdb.admin.CartoDBTableMetadata({
          id: layer.get('table_id')
        });
        table.fetch({
          success: function() {
            addIt(table)
          }
        });
      } else {
        addIt(this.options.table);
      }

    }
  },

  show: function(modName) {
    var width = 600
      , event_name = 'showPanel';

    // Select the tab

    var mod = this.getActivePane()
    mod.tabs.activate(modName);
    mod.panels.active(modName);

    switch (modName) {
      case 'wizards_mod':
      case 'infowindow_mod':
        width = 450;
        event_name = 'narrowPanel';
      default:
    }

    // Show panel -> trigger
    cdb.god.trigger(event_name);

    this.isOpen = true;
    this.$el.animate({
      width: width,
      right: 0
    }, this.animation_time);
  },

  hide: function(modName) {
    var panel_width = this.$el.width();

    // Hide the tab
    var mod = this.getActivePane()
    //mod.tabs.deactivate(modName);

    // Hide panel -> trigger
    cdb.god.trigger("hidePanel");

    this.isOpen = false;
    this.$el.animate({
      right: 63 - panel_width
    }, this.animation_time);
  },

  toggle: function(modName) {
    // only hide if we click on active tab
    if(this.isOpen && modName == this.getActivePane().panels.activeTab) {
      this.hide(modName);
    } else {
      this.show(modName);
    }
  },

  setActiveWorkView: function(workView) {
    this.hide();
    this.activeWorkView = workView;
    var p = this.getActivePane()
    if(p) {
      p.setActiveWorkView(workView);
    }
  }

});

