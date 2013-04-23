//
// manage layers, its order and when should be shown or hiden
//
cdb.admin.LayersPanel = cdb.ui.common.TabPane.extend({

  className: 'table_panel',
  animation_time: 300,

  _TEXTS: {
    _NAME_VISUALIZATION_MSG: _t('If you want to add multiple layers you need to create a visualization.')
  },

  events: {
    'click .add_layer': '_addLayerDialog'
  },

  initialize: function() {
    cdb.ui.common.TabPane.prototype.initialize.call(this);

    this.vis = this.options.vis;
    this.map = this.vis.map;
    this.add_related_model(this.map);

    this.map.layers.bind('add', this._addLayer, this);
    this.map.layers.bind('reset', this._resetLayers, this);
    this._addLayers(this.map.layers);

    this.isOpen = true;
    this.activeWorkView = 'table';

    /* test */
    _.bindAll(this, 'manageLayers');
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
    if (layer.get('type') == 'CartoDB') {
      var v = new cdb.admin.LayerPanelView({
          model: layer,
          map: self.map,
          user: self.options.user,
          globalError: self.options.globalError
      });

      v.bind('toggle', self.toggle, self);
      v.bind('switchTo', self.switchTo, self);
      self.addTab(layer.cid, v);
      v.setActiveWorkView(self.activeWorkView);
      self.trigger('switch', v);

      self.switchTo(v);
      self.bindSort();

      self._addLayerAddButton();
    }
  },

  _addLayerAddButton: function() {
    this.$('.add_layer').remove();
    var template = this.getTemplate('table/views/add_layer');
    this.$el.prepend(template());
  },

  _addLayerDialog: function(e) {
    this.killEvent(e);
    var self = this;
    
    var dlg = new cdb.admin.NewLayerDialog({
      ok: function(tableName) {
        if(!self.vis.isVisualization()) {
          new cdb.admin.NameVisualization({
            msg: self._TEXTS._NAME_VISUALIZATION_MSG,
            res: function(name) {
              self.vis.changeToVisualization(function() {
                self.map.addCartodbLayerFromTable(tableName);
                self.vis.save({ name: name });
              });
            }
          }).appendToBody().open();
        } else {
          self.map.addCartodbLayerFromTable(tableName);
        }
      }
    })
    dlg.appendToBody().open();
  },

  bindSort: function() {
    this.$el
      .sortable('destroy')
      .sortable({
        axis:       "y",
        items:      "> .layer_panel",
        handle:     ".layer_info",
        contaiment: this.$el,
        opacity:    0.5,
        change:     this.manageLayers
      });
  },

  manageLayers: function() {
    var $active_layer = this.activePane.$el;

    // Move rest of panels
    this.$el.find('.layer_panel').removeClass('active');

    // Add active class
    $active_layer.addClass('active');

    // Set rest of layer_panels to height 60px
    // Decide later about compress them
    this.$el.find('.layer_panel').not('.layer_panel.active').css({
      height: 66
    });

    // Get previous siblings and calculate space
    var pre_size = $active_layer.prevAll('.layer_panel').size();
    var t_s = (pre_size == 0) ? 0 : (pre_size * 53);

    // Get next siblings and calculate space
    var next_size = $active_layer.nextAll('.layer_panel').size();
    var b_s = (next_size == 0) ? 0 : (next_size * 53);

    // Set available space for the active layer_space
    $active_layer.css({
      height: this.$el.height() - (t_s + b_s) - 40
    })
  },

  switchTo: function(l) {
    // TESTING! - DON'T BE RUDE
    this.active(l.dataLayer.cid);
    this.trigger('switch', l);
    this.manageLayers();
  },

  changeWithin: function(type) {
    var width = 450
      , action = 'narrowPanel';

    if (type == "carto") {
      width = 600;
      action = 'showPanel';
    }

    cdb.god.trigger('panel_action', action);

    this.$el.animate({
      width: width,
      right: 0
    }, this.animation_time);
  },

  show: function(modName) {
    var width = 600,
        action = 'show';

    // Select the tab

    var mod = this.getActivePane();
    mod.tabs.activate(modName);
    mod.panels.active(modName);

    switch (modName) {
      case 'filters_mod':
      case 'wizards_mod':
      case 'infowindow_mod':
        width = 450;
        action = 'narrow';
        break;
      default:
    }

    // Show panel -> trigger
    cdb.god.trigger('panel_action', action);

    this.isOpen = true;
    this.$el.animate({
        width: width,
        right: 0
    }, this.animation_time);
  },

  hide: function(modName) {
    var panel_width = this.$el.width();

    // Hide the tab
    var mod = this.getActivePane();
    //mod.tabs.deactivate(modName);

    // Hide panel -> trigger
    cdb.god.trigger("panel_action", "hide");

    this.isOpen = false;
    this.$el.animate({
        right: 63 - panel_width
    }, this.animation_time);
  },

  toggle: function(modName) {
    // only hide if we click on active tab
    if (this.isOpen && modName == this.getActivePane()
        .panels.activeTab) {
        this.hide(modName);
    } else {
        this.show(modName);
    }
  },

  setActiveWorkView: function(workView) {
    this.hide();
    this.activeWorkView = workView;
    var p = this.getActivePane()
    if (p) {
        p.setActiveWorkView(workView);
    }
  }

});
