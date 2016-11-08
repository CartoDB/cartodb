
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
    _sharedEmptyDatasetDisabled: false,
    _emptyDatasetName: '',

    _TEXTS: {
      saving:         _t('Saving...'),
      saved:          _t('Saved'),
      sort: {
        torque: _t('Animated layers must be on top of other layers.'),
        tiled:  _t('Tiled layers can\'t be above animated layers.')
      },
      raster:   _t("You can't add a raster layer into a visualization"),
      error: {
        default: _t('Something went wrong, try again later')
      }
    },

    _MAX_DESCRIPTION_LENGTH: 200,

    events: {
      'click .title-bar':      '_switchToTitleLayer',
      'click .title-label':    '_changeTitle',
      'click .collapse':       '_togglePanel',
    },

    initialize: function() {
      this.layer_panels = []; // Layer panels added in the current visualization
      this.vis = this.options.vis;
      this.master_vis = this.options.master_vis;
      this.map = this.vis.map;
      this.user = this.options.user;
      this.globalError = this.options.globalError;
      this.panelOpen = false;
      this.metadataOpen = false;
      this._sharedEmptyDatasetDisabled = this.user.featureEnabled("bbg_disabled_shared_empty_dataset");
      if (!this._sharedEmptyDatasetDisabled) {
        this._emptyDatasetName = cdb.config.get('shared_empty_dataset_name');
      }

      // View bindings
      _.bindAll(this, '_switchToTitleLayer', '_togglePanel', '_changeTitle', '_sortStart', '_sortChange', '_sortBeforeStop', '_sortLayers',
      '_manageLayers', '_checkResize', '_moveSortTooltip');

      this.map.layers.bind('add',    this._newLayer, this);
      this.map.layers.bind('reset',  this._resetLayers, this);
      this.map.layers.bind('add remove', this._updateLayerPositionLabel, this);
      $(window).bind('resize', this._checkResize);
      this.add_related_model(this.map.layers);
      this.add_related_model(this.map);
      this._bindSort(); // Bind sort movement
      this.bind('show-panel',  this._showPanel, this);
      this.bind('hide-panel',  this._hidePanel, this);

      // the following call is not needed, 'reset' on map.layers will be raised
      // after this is loaded. If the map data was not loaded using AJAX this would
      // need to be enabled
      //this._addLayers(this.map.layers);

      // Setting several view parameters
      this.model = new cdb.core.Model({
        open:           true,
        activeWorkView: 'table'
      });

      // Display visualization title info
      this._setName();

      // Add panel toggle button
      this._addToggleButton();

      // Bind model changes
      this.model.bind('change:open', this._setPanelState, this);
      this.model.bind('change:state change:connected', this.render, this);

      // Visualization changes
      this.vis.bind('change:name', this._setName, this);
      this.vis.bind('change:type', this.hide, this);
      this.add_related_model(this.vis);

      cdb.ui.common.TabPane.prototype.initialize.call(this);
    },

    /******
    ******* Title layer functions *******
    *******/

    /**
     *  Set name of the visualization
     */
    _setName: function() {
      var $title = this.$('a span.title');

      $title
        [(this.isVisEditable())? 'removeClass' : 'addClass' ]('disabled')
        .text(this.vis.get('name'));

      document.title = this.vis.get('name') + " | Bloomberg Maps";
    },

    /**
     *  Change visualization title
     */
    _changeTitle: function(e) {
      this.killEvent(e);

      if (!!this.panelOpen) {
        var self = this;
        var isOwner = this.vis.permission.isOwner(this.options.user);

        if (this.isVisEditable()) {
          this.title_dialog && this.title_dialog.clean();
          cdb.god.trigger("closeDialogs");

          var title_dialog = this.title_dialog = new cdb.admin.EditTextDialog({
            initial_value: this.vis.get('name'),
            template_name: 'table/views/edit_name',
            clean_on_hide: true,
            modal_class: 'edit_name_dialog',
            onResponse: setTitle
          });

          cdb.god.bind("closeDialogs", title_dialog.hide, title_dialog);

          // Set position and show
          var pos = $(e.target).offset();
          pos.left -= $(window).scrollLeft();
          pos.top -= $(window).scrollTop();
          var w = Math.max($(e.target).width() + 100, 280);
          title_dialog.showAt(pos.left, pos.top + 12, w);
          var input = title_dialog.$el.find("input");
          if (input.length > 0) {
            input[0].select();
          }
        } else {
          var $el = $(e.target);
          $el
            .bind('mouseleave', destroyTipsy)
            .tipsy({
              fade:     true,
              trigger:  'manual',
              html:     true,
              title:    function() {
                var mode = self.isSyncTable() ? 'sync' : 'read-only';
                return _.template(self._TEXTS.rename[ !isOwner ? 'owner' : 'readonly' ])({ mode: mode });
              }
            })
            .tipsy('show');
        }
      }

      function destroyTipsy() {
        var $el = $(this);
        var tipsy = $el.data('tipsy');
        if (tipsy) {
          $el
            .tipsy('hide')
            .unbind('mouseleave', destroyTipsy);
        }
      }

      function setTitle(val) {
        if (val !== self.vis.get('name') && val !== '') {
          // Sanitize description (html and events)
          var title = cdb.Utils.stripHTML(val,'');

          if (self.vis.isVisualization()) {
            self._onSetVisAttributes({ name: title });
          } else {
            // close any prev modal if existing
            if (self.change_confirmation) {
              self.change_confirmation.clean();
            }
            self.change_confirmation = cdb.editor.ViewFactory.createDialogByTemplate('common/dialogs/confirm_rename_dataset');

            // If user confirms, app set the new name
            self.change_confirmation.ok = function() {
              self._onSetVisAttributes({ name: title });
              if (_.isFunction(this.close)) {
                this.close();
              }
            };

            self.change_confirmation
              .appendToBody()
              .open();
          }
        }
      }
    },

    /*
    *  Wait function before set new visualization title
    */
    _onSetVisAttributes: function(d) {

      var old_data = this.vis.toJSON();
      var new_data = d;

      this.vis.set(d, { silent: true });

      // Check if there is any difference
      if (this.vis.hasChanged()) {
        var self = this;

        this.globalError.showError(this._TEXTS.saving, 'load', -1);

        this.vis.save({},{
          wait: true,
          success: function(m) {
            // Check if attr saved is name to change url
            if (new_data.name !== old_data.name && !self.vis.isVisualization()) {
              window.table_router.navigate(self._generateTableUrl(), {trigger: false});
              window.table_router.addToHistory();
            }
            self.globalError.showError(self._TEXTS.saved, 'info', 3000);
          },
          error: function(msg, resp) {
            var err =  resp && JSON.parse(resp.responseText).errors[0];
            self.globalError.showError(err, 'error', 3000);
            self.vis.set(old_data, { silent: true });
          }
        });
      }
    },

    /**
     *  Check if visualization/table is editable
     *  (Checking if it is visualization and/or data layer is in sql view)
     */
    isVisEditable: function() {
      if (this.vis.isVisualization()) {
        return true;
      } else {
        var table = this.dataLayer && this.dataLayer.table;

        if (!table) {
          return false;
        } else if (table && (table.isReadOnly() || !table.permission.isOwner(this.options.user))) {
          return false;
        } else {
          return true;
        }
      }
    },

    /* Add title layer functions */
    _switchToTitleLayer: function() {
      // Activate title layer
      var self = this;
      var $title = this.$('.title_layer');
      if (this.panelOpen){
        // Close table tabs
        this.hide();
        this.metadataOpen = true;
        $title.addClass('open');
        this.$('.title-layer-contents').show();
        $('.map').addClass('narrow');
        this.vis.save('title_layer_open', 'yes');

        this.$el.animate({
          width: 450,
          right: 0
        }, this.animation_time, function() {
          self._manageLayers();
        });
      }
    },

    _hideTitleLayer: function() {
      this.metadataOpen = false;
      this.$('.title-layer-contents').hide();
      var $title = this.$('.title_layer');
      $title.removeClass('open');
      this._manageLayers();
    },

    _addMetadataForm: function() {
      // Renders and disappears equal to map options
      if (!this.metadataForm) {
        this.metadataForm = new cdb.admin.MetadataForm({
          user:        this.user,
          model:       this.map,
          vis:         this.vis,
          dataLayer:   this.map.get('dataLayer')
        });
        this.addView(this.metadataForm);
        $(".title-layer-contents").append(this.metadataForm.render().el);
      }
    },

    _addMapOptions: function() {
      if (!this.mapOptionsDropdown) {
        this.mapOptionsDropdown = new cdb.admin.MapOptionsDropdown({
          target:              $('.title-layer-contents'),
          template_base:       "table/views/map_options_dropdown",
          table:               table,
          model:               this.map,
          collection:          this.vis.overlays,
          user:                this.user,
          vis:                 this.vis,
          position:            "position",
          vertical_position:   "down",
          horizontal_position: "right",
          horizontal_offset:   "3px"
        });

        this.mapOptionsDropdown.bind("createOverlay", function(overlay_type, property) {
          this.vis.overlays.createOverlayByType(overlay_type, property);
        }, this);

        this.addView(this.mapOptionsDropdown);

        $(".title-layer-contents").append(this.mapOptionsDropdown.render().el);
      }
    },

    /******
    ******* End title layer functions
    *******/


    /******
    ******* Panel toggling functions *******
    *******/

    /* Add panel toggle button */
    _addToggleButton: function() {
      var template = this.getTemplate('table/views/layer_panel_toggle');
      this.$el.prepend(template());
    },

    // Setup panel depending view model state
    _setPanelState: function() {
      // If it is open, add open class
      this.$el[ this.model.get('open') ? 'addClass' : 'removeClass' ]('opened');
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

      if (!!this.panelOpen) {
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
      }
    },


    _showPanel: function() {
      //TODO: The toggle button disappears on panel open
      // Switch toggle arrow

      if (this.panelOpen) {
        // Panel is already open, don't open it again
        return;
      }

      if (this._sharedEmptyDatasetDisabled || this.getActivePane()) {
        this.$('.collapse').addClass('open');
        this.panelOpen = true;

        // Show panel -> trigger
        var active_pane = this.getActivePane().panels.getActivePane();
        var action  = active_pane.getModuleAction();
        cdb.god.trigger('panel_action', action.type);

        // Set open model attribute as true
        this.model.set('open', true);

        this.$el.animate({
          width: action.width,
          right: 0
        }, this.animation_time);
      } else {
        this.$('.collapse').addClass('open');
        this.panelOpen = true;

        // Show panel -> trigger
        this._switchToTitleLayer();
        cdb.god.trigger('panel_action', 'narrow');

        // Set open model attribute as true
        this.model.set('open', true);
      }
      this.$('.collapse').attr("title", "Collapse side panel");
    },

    _hidePanel: function() {
      var panel_width = this.$el.width();

      // Hide panel -> trigger
      cdb.god.trigger("panel_action", "hide");

      // Set open model attribute as true
      this.model.set('open', false);

      this.$el.animate({
        right: -panel_width
      }, this.animation_time);

      this.$('.collapse').removeClass('open');
      this.$('.collapse').attr("title", "Expand side panel");
      this.panelOpen = false;
    },

    _togglePanel: function() {
      // open/hide panel if toggle button clicked
      if (!!this.panelOpen) {
        this._hidePanel();
      } else {
        this._showPanel();
      }
    },

    /******
    ******* End panel toggling functions
    *******/

    /******
    ******* Layer functions *******
    *******/

    _resetLayers: function() {
      //clean all views
      this.removeTabs();
      // Empty layers array
      this.layer_panels = [];
      // Add again the layers
      this._addLayers(this.map.layers);
    },

    _addLayers: function(layers) {
      // Add 'title' button first
      this._addTitleLayer();

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
      var emptyDataset = layer.get('table_name') === self._emptyDatasetName;

      if (layer.get('type') == 'CartoDB' ||
          layer.get('type') == 'torque') {

        var v = new cdb.admin.LayerPanelView({
          model: layer,
          vis: self.vis,
          user: self.user,
          globalError: self.options.globalError
        });

        v.bind('toggle',    self._toggle, self);
        v.bind('switchTo',  self._switchTo, self);
        v.bind('delete',    self._openDeleteLayerDialog, self);
        v.bind('show',      self.show, self);
        v.bind('destroy',   self._removeLayer, self);
        v.bind('addColumn', self._addColumn, self);
        v.bind('toggle', self._showPanel, self);

        if (!emptyDataset) {
          self.addTab(layer.cid, v, { after: 0 });
        }

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
      if (this._sharedEmptyDatasetDisabled) {
        this._checkLayers();
        this._manageLayers();
      }

      if (self.map.layers.getDataLayers().length === 1) {
        _.last(self.map.layers.getDataLayers()).set('visible', true);
      }

      if (!this._sharedEmptyDatasetDisabled) {
        var dataLayers = self.map.layers.getDataLayers();
        var numDataLayers = dataLayers.length;
        var i, numVisibleLayers = numDataLayers;

        for (i = 0; i < numDataLayers; ++i) {
          if (dataLayers[i].get('table_name') === self._emptyDatasetName) {
            numVisibleLayers--;
            break;
          }
        }

        if (numVisibleLayers === 1) {
          self._switchToTitleLayer();
        }

        this._checkLayers();
        this._manageLayers();
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
      var cartodbLayers = this.map.layers.getDataLayers().length;

      if (cartodbLayers === 1) {
        this._unbindSort();
      } else {
        this._bindSort();
      }
    },

    _addTitleLayer: function() {
      this.$('.title_layer').remove();

      var template = this.getTemplate('table/views/add_title_layer');
      var d = {
        'title': this.vis.get('name')
      };

      this.$el.prepend(template(d));
      this._addMetadataForm();
      if (this.vis.isVisualization()) {
        this._addMapOptions();
      }
    },

    _bindLayerTooltip: function(v) {
      var self = this;
      this._unbindLayerTooltip(v);
      v && v.$('.info').tipsy({
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
      v && v.$(".info").unbind('mouseenter mouseleave');
      if (v && v.$(".info").data('tipsy')) v.$(".info").data('tipsy').remove();
    },

    _hideLayerTooltip: function(v) {
      v && v.$(".info").tipsy("hide")
    },

    /******
    ******* End Layer functions *******
    *******/


    ////////////////////
    // Sort functions //
    ////////////////////

    _unbindSort: function() {
      if (this.$el.data('ui-sortable')) {
        this.$el.sortable('destroy');
      }
    },

    _bindSort: function() {
      this.$el.sortable({
        axis: "y",
        items: "> .layer_panel",
        handle: ".layer-info .info",
        cancel: '',
        contaiment: "parent",
        opacity: 0.5,
        start: this._sortStart,
        change: this._sortChange,
        beforeStop: this._sortBeforeStop,
        update: this._sortLayers,
        forcePlaceholderSize: false
      }).disableSelection();
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

          this.$('div.title-label').after(
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
      if (!this._sharedEmptyDatasetDisabled) {
        var dataLayers = self.map.layers.getDataLayers();
        var i, numDataLayers = dataLayers.length;
        var hasSharedEmptyDataset = false;

        for (i = 0; i < numDataLayers; ++i) {
          if (dataLayers[i].get('table_name') === self._emptyDatasetName) {
            hasSharedEmptyDataset = true;
            break;
          }
        }
        if (hasSharedEmptyDataset) {
          newIndex++;
        }
      }
      var layerId = ui.item.attr('model-id');
      var layer = this.map.layers.get(layerId);

      // layers don't need to be reset when they are sorted
      // and save the new layers order to the server
      this.map.layers.unbind('reset', this._resetLayers, this);

      this.map.layers.moveLayer(layer, {
        to: newIndex,
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
      var cartodbLayers = this.map.layers.getDataLayers().length;

      // If there isn't any layer added
      if (cartodbLayers === 0) {
        return false;
      }

      var activePane = this.getActivePane();
      if (this._sharedEmptyDatasetDisabled && !activePane) {
        return false;
      }

      var $el = $(this.el);
      var $active_layer = (this.metadataOpen || !activePane) ? $el.find('.title_layer') : activePane.$el;

      // Move rest of panels
      this.$('.layer_panel').removeClass('active');

      if (activePane) {
        if (this.metadataOpen) {
          activePane.$el.find('.layer-sidebar').hide();
          activePane.$el.find('.layer-views').hide();
        } else {
          $el.find('.title_layer').css({height: 40});
          activePane.$el.find('.layer-sidebar').show();
          activePane.$el.find('.layer-views').show();
          activePane.$el.addClass('active');
        }
      }

      // Set rest of layer_panels to height 60px
      // Decide later about compress them
      // TODO: not use jquery
      this.$('.layer_panel').not('.layer_panel.active').css({ height: 30 });

      // Get previous siblings and calculate space
      // TODO: not use jquery
      var pre_size = $active_layer.prevAll('.layer_panel').size();
      var t_s = (pre_size == 0) ? 0 : (pre_size * 30);

      // Get next siblings and calculate space
      // TODO: not use jquery
      var next_size = $active_layer.nextAll('.layer_panel').size();
      var b_s = (next_size == 0) ? 0 : (next_size * 30);

      // Set layers offset
      var offset = this.metadataOpen ? 0 : -40;

      $active_layer.css({ height: this.$el.height() - (t_s + b_s) + offset });

      _.each(this.layer_panels, function(layer) { // allow filter panel updates during switch
        layer.allowFiltersRefresh();
      });
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

    hide: function(modName) {
      // Hide the tab
      var mod = this.getActivePane();
      this._hideDropdowns();
    },

    _hideDropdowns: function() {

      cdb.god.trigger("closeDialogs");
      cdb.god.trigger("closeDialogs:color");

    },

    // l    -> layer view
    // open -> flag to know if it is necessary to open the panel
    _switchTo: function(l, open) {
      // Close title layer if open
      this._hideTitleLayer();
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

      this.vis.save('title_layer_open', 'no');

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

    _openDeleteLayerDialog: function(layerView) {
      var view = new cdb.editor.DeleteLayerView({
        model: layerView.model
      });
      view.appendToBody();
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
      this.removeTabs();
      this._unbindSort();
      this.elder('clean');
    }
  });
