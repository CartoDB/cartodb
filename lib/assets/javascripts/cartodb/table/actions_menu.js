
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

    _MAX_LAYERS: 3,
    _MIN_LAYERS: 1,

    _TEXTS: {
      visualization: {
        msg:    _t('If you want to add multiple layers you need to create a visualization.'),
        error:  _t('Error adding that table into the new visualization'),
        forbidden: _t('The layer can\'t be added, some users don\'t have rights to see this table')
      },
      remove: {
        title:  _t('Delete this layer'),
        desc:   _t('You are about to delete this layer. Doing so won\'t remove your table, \
                only this visualization will be affected.'),
        ok:     _t('Delete layer')
      },
      cant_remove: {
        title:  _t('Delete this layer'),
        desc:   _t('You can\'t remove all layers from the visualization, it needs at least one to make it work.'),
        ok:     _t('Close')
      },
      sort: {
        torque: _t('Animated layers must be on top of other layers.'),
        tiled:  _t('Tiled layers can\'t be above animated layers.')
      },
      raster:   _t("You can't add a raster layer into a visualization"),
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
      this.master_vis = this.options.master_vis;
      this.map = this.vis.map;
      this.globalError = this.options.globalError;

      // Set max layers if user has this parameter
      var max_user_layers = this.options.user.get('max_layers');
      if (!isNaN(max_user_layers) && this._MAX_LAYERS != max_user_layers) {
        this._MAX_LAYERS = max_user_layers;
      }

      // View bindings
      _.bindAll(this, '_sortStart', '_sortChange', '_sortBeforeStop', '_sortLayers',
      '_manageLayers', '_checkResize', '_moveSortTooltip');

      this.map.layers.bind('add',    this._newLayer, this);
      this.map.layers.bind('reset',  this._resetLayers, this);
      this.map.layers.bind('add remove', this._updateLayerPositionLabel, this);
      $(window).bind('resize', this._checkResize);
      this.add_related_model(this.map);
      this._bindSort(); // Bind sort movement

      // the following call is not needed, 'reset' on map.layers will be raised
      // after this is loaded. If the map data was not loaded using AJAX this would
      // need to be enabled
      //this._addLayers(this.map.layers);

      // Setting several view parameters
      this.model = new cdb.core.Model({
        open:           true,
        activeWorkView: 'table'
      });

      // Bind model changes
      this.model.bind('change:open', this._setPanelState, this);

      // Visualization changes
      this.vis.bind('change:type', this.hide, this);
      this.add_related_model(this.vis);

      cdb.ui.common.TabPane.prototype.initialize.call(this);
    },

    // Setup panel depending view model state
    _setPanelState: function() {
      // If it is open, add open class
      this.$el[ this.model.get('open') ? 'addClass' : 'removeClass' ]('opened');
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
      layers.each(function(l, pos) {
        self._addLayer(l, pos);
      });

      // Set default layer
      this._setDefaultLayer();

    },

    _newLayer: function(layer) {
      this._addLayer(layer);
    },

    _addLayer: function(layer, pos) {
      var self = this;
      if (layer.get('type') == 'CartoDB' ||
          layer.get('type') == 'torque') {

        var v = new cdb.admin.LayerPanelView({
          model: layer,
          vis: self.vis,
          user: self.options.user,
          globalError: self.options.globalError
        });

        v.bind('toggle',    self._toggle, self);
        v.bind('switchTo',  self._switchTo, self);
        v.bind('delete',    self._openDeleteLayerDialog, self);
        v.bind('show',      self.show, self);
        v.bind('destroy',   self._removeLayer, self);
        v.bind('addColumn', self._addColumn, self);

        self.addTab(layer.cid, v, { after: 0 });
        v.setActiveWorkView(self.model.get('activeWorkView'));
        self.layer_panels.push(v);
        self._bindLayerTooltip(v);

        // no pos -> new layer -> set as current
        if (!pos) {
          self._switchTo(v, true);
          v.setPanelStatus();
        }

        self._checkLayers();
      }
    },

    _addColumn: function() {
      table.tableTab.tableView.addColumn();
    },

    _removeLayer: function(dataLayerCid) {
      var layer_view = this.getPane(dataLayerCid);
      var self = this;

      this.layer_panels = _.filter(this.layer_panels, function(view) {
        if (view != layer_view) return view;
      });

      var tabBind = function(dataLayerCid) {
        var view = self.getPane(dataLayerCid);
        self.trigger('switch', view);
        self.vis.save('active_layer_id', view.dataLayer.id);
        self.show(view.panels.activeTab);
        self.unbind('tabEnabled', tabBind);
      }

      this.bind('tabEnabled', tabBind);

      this._unbindLayerTooltip(layer_view);
      this.removeTab(dataLayerCid);
      this._checkLayers();
      this._manageLayers();
      if (self.map.layers.getDataLayers().length === 1) {
        _.last(self.map.layers.getDataLayers()).set('visible', true);
      }
    },

    _setDefaultLayer: function() {
      var layer_id = this.vis.get('active_layer_id');
      var layer = _.last(this.layer_panels);

      // Get layer from layer_id
      if (layer_id) {
        for (var i in this.layer_panels) {
          var lyr = this.layer_panels[i];
          if (lyr.dataLayer.id == layer_id) {
            layer = lyr;
            break;
          }
        }
      }

      // Any layer? Switch to it
      if (layer) {
        this._switchTo(layer, false);
      }
    },


    // Check how many layers-view there are in the panel
    _checkLayers: function() {
      var cartodb_layers = this.map.layers.getDataLayers().length;
      if (cartodb_layers >= this._MAX_LAYERS) {
        this._hideLayerButton();
      } else {
        this._showLayerButton();
      }

      if (cartodb_layers == 1) {
        this._unbindSort();
      } else {
        this._bindSort();
      }
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

      if (this.options.user.featureEnabled('new_modals')) {
        if (this.vis.isVisualization()) {
          this._createAddLayerDialog();
        } else {
          var self = this;
          var createVisFirstView = new cdb.editor.CreateVisFirstView({
            clean_on_hide: true,
            enter_to_confirm: true,
            model: this.vis,
            router: window.table_router,
            title: 'A map is required to add layers',
            explanation: 'A map is a shareable mix of layers, styles and queries. You can view all your maps in your dashboard.',
            success: function() {
              self._createAddLayerDialog();
            }
          });
          createVisFirstView.appendToBody();
        }
      } else {
        // Clean previous 'new layer' dialog
        this.new_layer_dlg && this.new_layer_dlg.clean();

        this.new_layer_dlg = new cdb.admin.CreateLayerDialog({
          user:   this.options.user,
          data:   {},
          states: cdb.admin.CreateLayerDialog.states,
          tabs:   ['layer', 'file', 'gdrive', 'dropbox', 'twitter', 'scratch', 'arcgis', 'salesforce', 'success', 'error'],
          option: 'layer',
          where:  'table'
        });

        this.new_layer_dlg
          .bind('importCompleted',  this._importCompleted, this)
          .bind('importDone',       this._importDone, this)
          .bind('showUpgrade',      this._showUpgrade, this);

        this.new_layer_dlg.appendToBody().open({ center: true });
      }
    },

    _createAddLayerDialog: function() {
      var model = new cdb.editor.AddLayerModel({}, {
        vis: this.vis,
        map: this.map,
        user: this.options.user
      });
      var dialog = new cdb.editor.AddLayerView({
        model: model,
        user: this.options.user
      });
      dialog.appendToBody();
    },

    _showUpgrade: function() {
      var dlg = new cdb.admin.UpgradeDialog({
        model: this.options.user,
        config: cdb.config
      });

      this.$el.append(dlg.render().el);
      dlg.open();
    },

    _importDone: function(m, dlg) {
      this._addVisLayer(m, dlg);
    },

    _importCompleted: function(m, dlg) {
      // From Twitter search?
      if (m.service_name === "twitter_search") {
        // Refresh user model
        this.options.user.fetch();
        return false;
      }

      // Comes from raster?
      if (m.any_table_raster) {
        // Refresh user model
        this.options.user.fetch();
        // Close the dialog...
        dlg.hide();
        // Show warning
        this.globalError.showError(this._TEXTS.raster, 'warn');
        return false;
      }

      this._addVisLayer(m, dlg);
    },

    _addVisLayer: function(m, dlg) {
      var self = this;
      var table_name = m.table_name;
      var user_name = self.options.user.get('name');

      dlg.hide();

      if(!this.master_vis.isVisualization()) {
        this.create_vis_dialog && this.create_vis_dialog.clean();
        this.create_vis_dialog = new cdb.admin.CreateVizDialog({
          model: this.master_vis,
          msg: this._TEXTS.visualization.msg
        });

        this.create_vis_dialog.ok = function(vis) {
          self.map.addCartodbLayerFromTable(table_name, user_name, {
            success: function() {
              // layers need to be saved because the order may changed
              self.map.layers.saveLayers({ silent: true });
              // Get scenario param (table or map)
              var last_route = window.table_router.history.length > 0 && _.last(window.table_router.history).split('/');
              // Create url
              // TODO: use viewUrl from this.vis
              var url = "/viz/" + self.master_vis.get("id") + "/" + ( last_route[2] || 'table' );
              // Navigate
              window.table_router.navigate(url, { trigger: false });
              window.table_router.addToHistory();
            },
            error: function() {
              self.create_vis_dialog.onCreationError(null, self._TEXTS.visualization.error);
            }
          });
        }

        self.create_vis_dialog.appendToBody().open();
      } else {
        // Add new layer
        this.map.addCartodbLayerFromTable(table_name, user_name, {
          vis: self.vis,
          success: function() {
              // layers need to be saved because the order may changed
              self.map.layers.saveLayers();
          },
          error: function(err, forbidden) {
            if (err === 'forbidden') {
              self.create_vis_dialog.onCreationError(null, self._TEXTS.visualization.forbidden);
            }

          }
        });
      }
    },

    _bindLayerTooltip: function(v) {
      var self = this;
      this._unbindLayerTooltip(v);
      v && v.$('a.info').tipsy({
        live: true,
        gravity: 'e',
        offset: 0,
        fade: true,
        title: function() {
          if (!self.vis.isVisualization() || self.model.get('open')) {
            return '';
          }
          return $(this).find('span.name').text();
        }
      });
    },

    _unbindLayerTooltip: function(v) {
      v && v.$("a.info").unbind('mouseenter mouseleave');
      if (v && v.$("a.info").data('tipsy')) v.$("a.info").data('tipsy').remove();
    },

    _hideLayerTooltip: function(v) {
      v && v.$("a.info").tipsy("hide")
    },


    ////////////////////
    // Sort functions //
    ////////////////////

    _unbindSort: function() {
      this.$el.sortable('destroy')
    },

    _bindSort: function() {
      this._unbindSort();

      this.$el.sortable({
        axis: "y",
        items: "> .layer_panel",
        handle: ".layer-info a.info",
        contaiment: "parent",
        opacity: 0.5,
        start: this._sortStart,
        change: this._sortChange,
        beforeStop: this._sortBeforeStop,
        update: this._sortLayers,
        forcePlaceholderSize: false
      });
    },

    // Before start sorting action
    _sortStart: function(e, ui) {
      this.sort_actions = {
        original_layer_pos: $(ui.item).index(),
        $layer: $(ui.item)
      }
      var active_height = $(ui.item).outerHeight();
      $(ui.placeholder).outerHeight(active_height);
    },

    // When any change happens sorting
    // - If a torque layer tries to move to other position, sorting is cancelled
    //   and a yellow tooltip should appear.
    // - If a cartodb layer tries to move to other position and there is a torque
    //   layer in the visualization, sorting is cancelled and a yellow tooltip
    //   should appear.
    _sortChange: function(e, ui) {
      var isAnyTorque = _.contains(this.map.layers.pluck('type'), 'torque');
      var isLayerTorque = $(ui.item).attr('layer-type') == "torque";
      var active_height = $(ui.item).outerHeight();

      // Torque
      if (isAnyTorque) {
        // Torque layer
        if (isLayerTorque) {
          if (ui.placeholder.index() == 1) {
            this.cancelSort = false;
            this._removeSortTooltip();
          } else {
            this.cancelSort = true;
            if (!this.sortTooltip) this._addSortTooltip(e, 'torque');
          }

          this.$('section.add_layer').after(
            $(ui.placeholder)
              .outerHeight(active_height)
              .css('display','block')
          )
        } else {
          if (ui.placeholder.index() != 1) {
            this.cancelSort = false;
            $(ui.placeholder)
              .outerHeight(active_height)
              .css('display','block');
            this._removeSortTooltip();
          } else {
            this.cancelSort = true;

            this.$('section.layer_panel:eq(' + this.sort_actions.original_layer_pos + ')').before(
              $(ui.placeholder)
                .outerHeight(active_height)
                .css('display','block')
            )

            if (!this.sortTooltip) this._addSortTooltip(e, 'tiled');
          }
        }
      } else {
        this.cancelSort = false;
        $(ui.placeholder)
          .outerHeight(active_height)
          .css('display','block');
      }
    },

    // If it is necessary to cancel de sorting
    _sortBeforeStop: function() {
      this._removeSortTooltip();

      if (this.cancelSort) this.$el.sortable('cancel');

      this.cancelSort = false;
    },

    _addSortTooltip: function(e, type) {
      this.sortTooltip = new cdb.admin.TooltipTrails({
        className:  'tooltip-trails',
        msg:        this._TEXTS.sort[type]
      });

      this.sort_actions.$layer.bind('mousemove', this._moveSortTooltip);
      this.$el.append(this.sortTooltip.render().el);

      this.sortTooltip.show({
        left: e.pageX - this.$el.offset().left,
        top: e.pageY - this.$el.offset().top
      });
      this.addView(this.sortTooltip);
    },

    _moveSortTooltip: function(e) {
      // Get correct first drag coordinates
      var parentOffset = this.$el.offset();
      var position = {
        left: (e.pageX - parentOffset.left),
        top: (e.pageY - parentOffset.top)
      };
      this.sortTooltip.move(position);
    },

    _removeSortTooltip: function() {
      this.sort_actions.$layer.unbind('mousemove', this._moveSortTooltip);
      if (this.sortTooltip) {
        this.sortTooltip.clean();
        this.removeView(this.sortTooltip);
        delete this.sortTooltip;
      }
    },

    _sortLayers: function(event, ui) {
      var self = this;

      // New index of the layer in the collection of layers, assuming there
      // is a base layer at position 0
      var newIndex = $('.layer_panel').length - $('.layer_panel').index(ui.item);
      var layerId = ui.item.attr('model-id');
      var layer = this.map.layers.get(layerId);

      this.map.layers.moveLayer(layer, { to: newIndex });

      // layers don't need to be reset when they are sorted
      // and save the new layers order to the server
      this.map.layers.unbind('reset', this._resetLayers, this);

      // TODO: Someone else should be responsible of triggering this
      this.map.layers.trigger('reset');
      this.map.layers.saveLayers({
        // TODO: what happens when there is an error?
        complete: function() {

          self._updateLayerPositionLabel();
          self.map.layers.bind('reset',  self._resetLayers, self);
        }
      });
    },

    _updateLayerPositionLabel: function() {
      _.each(this.layer_panels, function(layer) {
        layer.setLayerOrder(layer.model);
      });
    },

    /* Magic layers */
    _manageLayers: function() {
      var cartodb_layers = this.map.layers.getDataLayers().length;
      // If there isn't any layer added
      if (cartodb_layers == 0) return false;

      var $active_layer = this.activePane.$el;

      // Move rest of panels
      this.$('.layer_panel').removeClass('active');

      // Add active class
      $active_layer.addClass('active');

      // Set rest of layer_panels to height 60px
      // Decide later about compress them
      // TODO: not use jquery
      this.$('.layer_panel').not('.layer_panel.active').css({ height: 66 });

      // Get previous siblings and calculate space
      // TODO: not use jquery
      var pre_size = $active_layer.prevAll('.layer_panel').size();
      var t_s = (pre_size == 0) ? 0 : (pre_size * 43);

      // Get next siblings and calculate space
      // TODO: not use jquery
      var next_size = $active_layer.nextAll('.layer_panel').size();
      var b_s = (next_size == 0) ? 0 : (next_size * 43);

      // Set layers offset
      var offset = -15;

      // If max layers is equal to cartodb layers add
      // the 'add_layer' button space, due to it is hidden now.
      if (this._MAX_LAYERS == cartodb_layers) offset = offset + 43;
      $active_layer.css({ height: this.$el.height() - (t_s + b_s) + offset })
    },

    /* testing resize event */
    _checkResize: function(e) {
      if (this.resize) clearTimeout(this.resize);
      var self = this;
      this.resize = setTimeout(self._manageLayers, 100);
    },


    //////////////////////
    // Dialog functions //
    //////////////////////

    show: function(modName) {
      // Select the tab if it is not activated
      var mod = this.getActivePane();

      mod.tabs.activate(modName);
      mod.panels.active(modName);

      // Move right panel
      this.movePanel();
    },

    // Move right panel
    movePanel: function() {
      var mod = this.getActivePane();
      if (!mod) return false;

      this._hideDropdowns();

      // Get the action type and width
      // of the active module
      // var action = { module_event: narrow or show, module_width: 450 (integer) }
      var active_pane = mod.panels.getActivePane();
      var action  = active_pane.getModuleAction();

      // Show panel -> trigger
      cdb.god.trigger('panel_action', action.type);

      // Set open model attribute as true
      this.model.set('open', true);

      this.$el.animate({
        width: action.width,
        right: 0
      }, this.animation_time, function() {
        cdb.god.trigger("end_" + action.type);
      });
    },

    hide: function(modName) {
      var panel_width = this.$el.width();

      // Hide the tab
      var mod = this.getActivePane();

      this._hideDropdowns();

      // Hide panel -> trigger
      cdb.god.trigger("panel_action", "hide");

      // Set open model attribute as true
      this.model.set('open', false);

      this.$el.animate({
        right: 63 - panel_width
      }, this.animation_time);
    },

    _hideDropdowns: function() {

      cdb.god.trigger("closeDialogs");
      cdb.god.trigger("closeDialogs:color");

    },

    // l    -> layer view
    // open -> flag to know if it is necessary to open the panel
    _switchTo: function(l, open) {
      // If there is any change within layer tabs
      if (this.activePane) this.activePane.unbind('tabChanged', null, null);
      l.bind('tabChanged', this.movePanel, this);

      // Check if switched layer is active one
      if (this.activePane == l) {

        if (open !== undefined) {
          if (open === true) {
            this.show(l.panels.activeTab);
          } else {
            this.hide();
          }
        } else {
          if (this.model.get('open')) {
            this.hide();
          } else {
            this.show(l.panels.activeTab);
          }
        }
      }

        // if not, activate it
      if (this.activePane != l) {
        this._hideLayerTooltip(l);
        this.active(l.dataLayer.cid);
        if (l.dataLayer.id && this.vis.get('active_layer_id') != l.dataLayer.id) {
          this.vis.save('active_layer_id', l.dataLayer.id);
        }
        if (open === undefined) this.show(l.panels.activeTab);
      }

      // Send trigger
      this.trigger('switch', l);

      // Manage available layers
      this._manageLayers();
    },

    _toggle: function(modName) {
      // only hide if we click on active tab
      if (this.model.get('open') && modName == this.getActivePane().panels.activeTab) {
        this.hide(modName);
      } else {
        this.show(modName);
      }
    },

    // We need to review this method, it is not easy to
    // make operations when the view is cleaning/removing
    // For now the model destroy is happening here
    _openDeleteLayerDialog: function(layer_view) {
      if (this.options.user.featureEnabled('new_modals')) {
        var view = new cdb.editor.DeleteLayerView({
          model: layer_view.model
        });
        view.appendToBody();
        return;
      }

      var self = this;
      var permitted = true;

      // Check if there is at least 1 layer
      // if not, don't let user do it
      if (this.map.layers.getDataLayers().length <= this._MIN_LAYERS) {
        permitted = false;
      }

      this.remove_dlg && this.remove_dlg.clean();
      this.remove_dlg = new cdb.admin.BaseDialog({
        title: self._TEXTS[permitted ? 'remove' : 'cant_remove'].title,
        description: self._TEXTS[permitted ? 'remove' : 'cant_remove'].desc,
        template_name: 'old_common/views/confirm_dialog',
        clean_on_hide: true,
        enter_to_confirm: true,
        ok_button_classes: "right button grey",
        ok_title: self._TEXTS[permitted ? 'remove' : 'cant_remove'].ok,
        cancel_button_classes: "underline margin15 " + (permitted ? '' : 'hide'),
        modal_type: "confirmation",
        width: 500
      });

      if (permitted) {
        this.remove_dlg.ok = function() {
          layer_view.model.destroy({
            error: function(){
              self.globalError.showError(self._TEXTS.error.default, 'error', 3000);
            },
            wait: true
          });
        }
      }

      // Show it up
      this.remove_dlg
        .appendToBody()
        .open();
    },

    setActiveWorkView: function(workView) {
      this.hide();
      this.model.set('activeWorkView', workView);

      // Set active work view for all panes,
      // not only for the current one
      this.each(function(tab, pane){
        pane.setActiveWorkView(workView);
      })
    },

    clean: function() {
      $(window).unbind('resize', this._checkResize);
      if (this.resize) clearTimeout(this.resize);
      this._unbindSort();
      cdb.ui.common.TabPane.prototype.clean.call(this);
    }
  });
