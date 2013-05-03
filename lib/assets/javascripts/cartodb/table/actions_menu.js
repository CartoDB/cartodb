  
  /**
   *  Actions menu view, aka LayersPanel
   *
   *  - It needs at least visualization and user models.
   *    Globalerror to show connection or fetching errors.
   *  
   *    var menu = new cdb.admin.LayersPanel({
   *      vis: vis_model,
   *      user: user_model,
   *      globalError: globalError_obj
   *    });
   */

  cdb.admin.LayersPanel = cdb.ui.common.TabPane.extend({

    className: 'table_panel',
    animation_time: 300,

    _TEXTS: {
      name_visualization: {
        msg: _t('If you want to add multiple layers you need to create a visualization first.')
      },
      error: {
        default: _t('Something went wrong, try again later')
      }
    },

    events: {
      'click .add_layer': '_addLayerDialog'
    },

    initialize: function() {
      this.layer_panels = []; // Layer panels added in the current visualization
      this.vis = this.options.vis;
      this.map = this.vis.map;
      
      // View bindings
      _.bindAll(this, 'sortLayers', 'manageLayers', '_checkResize');
      this.map.layers.bind('add',    this._addLayer, this);
      // God... problems with PUT removing a layer
      // and setting new order :(
      // this.map.layers.bind('remove', this._removeLayer, this);
      this.map.layers.bind('reset',  this._resetLayers, this);
      $(window).bind('resize', this._checkResize);
      this.add_related_model(this.map);
      this.bindSort(); // Bind sort movement

      this._addLayers(this.map.layers);
      
      // Setting several pane parameters  
      this.isOpen = true;
      this.activeWorkView = 'table';

      cdb.ui.common.TabPane.prototype.initialize.call(this);
    },


    /* Layer panel functions */

    _resetLayers: function() {
      //clean all views
      this.removeTabs();
      // Empty layers array
      this.layer_panels = [];
      // Add again the layers
      this._addLayers(this.map.layers);
    },

    _addLayers: function(layers) {
      // Add 'add layer' button first
      this._addLayerAddButton();

      // Add layers
      var self = this;
      layers.each(function(l) {
        self._addLayer(l);
      });

      // Set default layer
      this._setDefaultLayer();
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

        v.bind('toggle',    self._toggle, self);
        v.bind('switchTo',  self._switchTo, self);
        v.bind('delete',    self._remove, self);

        self.addTab(layer.cid, v);
        v.setActiveWorkView(self.activeWorkView);

        self.layer_panels.push(v);

        self.trigger('switch', v);
        self._checkLayers();
      }
    },

    _removeLayer: function(cid) {
      var layer_view = this.getPane(cid);
      var self = this;

      this.layer_panels = _.filter(this.layer_panels, function(view) {
        if (view != layer_view) return view;
      });

      // Ok, testing
      this.bindNew && this.bindNew.unbind('tabEnabled');
      this.bind('tabEnabled', function(cid) {
        var view = self.getPane(cid);
        self.vis.set('active_layer_id', view.dataLayer.id);
      });

      this.removeTab(cid);

      this.manageLayers();
      this.sortLayers();
      this._checkLayers();
    },

    _setDefaultLayer: function() {
      var layer;
      var layer_id = this.vis.get('active_layer_id');

      // No layer_id, get last layer
      if (!layer_id) {
        var layer = _.last(this.layer_panels);
      }

      // Get layer from layer_id
      if (!layer) {
        for (var i in this.layer_panels) {
          var _layer = this.layer_panels[i];
          if (_layer.dataLayer.id == layer_id) {
            layer = _layer;
            break;
          }
        }
      }

      // Any layer? Switch to it
      if (layer) {
        this._switchTo(layer);
      }
    },



    _checkLayers: function() {
      if (this.map.layers.size() > 3) {
        this._hideLayerButton();
      } else {
        this._showLayerButton();
      }
      this.manageLayers();
    },


    /* Add layer functions */

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
              msg: self._TEXTS.name_visualization.msg,
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
      this.unbindSort();
      
      this.$el.sortable({
        axis:       "y",
        items:      "> .layer_panel",
        handle:     ".layer_info a.info",
        contaiment: this.$el,
        opacity:    0.5,
        stop:       this.sortLayers
      });
    },

    unbindSort: function() {
      this.$el.sortable('destroy')
    },

    sortLayers: function() {
      _.each(this.layer_panels, function(layer) {
        var dataLayer = layer.dataLayer;
        var order = $(layer.el).index('section.layer_panel') + 1;
        var current = parseInt(layer.$('.layer_info a.info .order').text());

        if ($(layer.el).hasClass('layer_panel') &&
          dataLayer &&
          order > 0 &&
          (order != dataLayer.get('order') || order != current)
        ) {
          dataLayer.save({ 'order': order }, { wait: true });
        }
      });
    },

    /* Magic english */
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
      var offset = this.map.layers.size() > 3 ? 15 : - 25;
      $active_layer.css({
        height: this.$el.height() - (t_s + b_s) + offset
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

    _switchTo: function(l) {
      this.active(l.dataLayer.cid);
      this.options.vis.save('active_layer_id', l.dataLayer.id);
      this.trigger('switch', l);
      this.manageLayers();
    },

    _toggle: function(modName) {
      // only hide if we click on active tab
      if (this.isOpen && modName == this.getActivePane().panels.activeTab) {
          this.hide(modName);
      } else {
          this.show(modName);
      }
    },

    // We need to review this method, it is not easy to 
    // make operations when the view is cleaning/removing
    // For now the model destroy is happening here
    _remove: function(layer_view) {
      var cid = layer_view.dataLayer.cid;
      var self = this;

      // Destroy layer model
      layer_view.model.destroy({
        success: function() {
          self._removeLayer(cid)
        },
        error: function(){
          self.globalError.showError(that._TEXTS.error.default, 'error', 3000);
        }
      });
    },

    setActiveWorkView: function(workView) {
      this.hide();
      this.activeWorkView = workView;

      // Set active work view for all panes,
      // not only for the current one
      this.each(function(tab, pane){
        pane.setActiveWorkView(workView);
      })
    },

    clean: function() {
      $(window).unbind('resize', this._checkResize);
      if (this.resize) clearTimeout(this.resize);
      this.unbindSort();
      cdb.ui.common.TabPane.prototype.clean.call(this);
    }
  });