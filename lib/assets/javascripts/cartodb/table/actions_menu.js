//
// manage layers, its order and when should be shown or hiden
//
cdb.admin.LayersPanel = cdb.ui.common.TabPane.extend({

  className: 'table_panel',
  animation_time: 300,

  _TEXTS: {
    _NAME_VISUALIZATION_MSG: _t('If you want to add multiple layers you need to create a visualization first.')
  },

  events: {
    'click .add_layer': '_addLayerDialog'
  },

  initialize: function() {
    /* test */
    _.bindAll(this, 'onSortLayers', 'manageLayers', '_checkResize');

    this.vis = this.options.vis;
    this.map = this.vis.map;
    this.add_related_model(this.map);

    this.map.layers.bind('add',    this._addLayer, this);
    this.map.layers.bind('remove', this._checkLayers, this);
    this.map.layers.bind('reset',  this._resetLayers, this);
    this._addLayers(this.map.layers);

    this.isOpen = true;
    this.activeWorkView = 'table';

    $(window).bind('resize', this._checkResize);

    cdb.ui.common.TabPane.prototype.initialize.call(this);
  },

  _resetLayers: function() {
    //clean all views
    this.removeTabs();
    this._addLayers(this.map.layers);
  },

  _addLayers: function(layers) {
    // Add 'add layer' button first
    this._addLayerAddButton();

    var self = this;
    layers.each(function(l) {
      self._addLayer(l)
    });

    // Bind sort
    this.bindSort();
  },

  _addLayer: function(layer) {
    var self = this;
    if (layer.get('type') == 'CartoDB') {
      var v = new cdb.admin.LayerPanelView({
          model: layer,
          vis: self.vis,
          user: self.options.user,
          globalError: self.options.globalError
      });

      v.bind('toggle',    self.toggle, self);
      v.bind('switchTo',  self.switchTo, self);
      //v.bind('clean',     self._remove, self);

      self.addTab(layer.cid, v);
      v.setActiveWorkView(self.activeWorkView);
      self.trigger('switch', v);

      self.switchTo(v);
      self._checkLayers();
    }
  },

  // _removeLayer: function() {
  //   this._checkLayers();
  // },

  _checkLayers: function() {
    if (this.map.layers.size() > 3) {
      this._hideLayerButton();
    } else {
      this._showLayerButton();
    }
    this.manageLayers();
  },

  _remove: function() {
    // this.removeTab();
    this.manageLayers();
  },

  _addLayerAddButton: function() {
    this.$('.add_layer').remove();
    var template = this.getTemplate('table/views/add_layer');
    this.$el.prepend(template());
  },

  _showLayerButton: function() {
    this.$('section.add_layer').show();
  },

  _hideLayerButton: function() {
    this.$('section.add_layer').hide();
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
        handle:     ".layer_info a.info",
        contaiment: this.$el,
        opacity:    0.5,
        stop:       this.onSortLayers
      });
  },

  onSortLayers: function (ev, ui) {
    this.sortLayers(ev,ui);
    this.manageLayers();
  },

  sortLayers: function(ev,ui) {
    for (var i in this._subviews) {
      var $el = this._subviews[i].$el;
      var dataLayer = this._subviews[i].dataLayer;
      var order = $(this._subviews[i].el).index('section.layer_panel') + 1;

      if ($el.hasClass('layer_panel') && order != dataLayer.get('order')) {
        dataLayer.save({
          'order': order
        });
      }
    }
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

  /* testing resize event */
  _checkResize: function(e) {
    if (this.resize) clearTimeout(this.resize);
    var self = this;
    this.resize = setTimeout(self.manageLayers, 100);
  },


  changeWithin: function(type) {
    var width = 450
      , action = 'narrow';

    if (type == "carto") {
      width = 600;
      action = 'show';
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

  switchTo: function(l) {
    // TESTING! - DON'T BE RUDE
    this.active(l.dataLayer.cid);
    this.trigger('switch', l);
    this.manageLayers();
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
  },

  clean: function() {
    $(window).unbind('resize', this._checkResize);
    if (this.resize) clearTimeout(this.resize);
    cdb.ui.common.TabPane.prototype.clean.call(this);
  }

});
