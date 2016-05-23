
  /**
   *  Layer panel view added in the right menu
   *
   *  - It needs at least layer, visualization and user models.
   *    Globalerror to show connection or fetching errors.
   *
   *  var layer_view = new cdb.admin.LayerPanelView({
   *    model:        layer_model,
   *    vis:          vis_model,
   *    user:         user_model,
   *    globalError:  globalError_obj
   *  });
   */


  cdb.admin.LayerPanelView = cdb.admin.RightMenu.extend({

    _TEXTS: {
      error:  {
        default:  _t('Something went wrong, try again later')
      },
      visible:    _t('This layer is hidden, changes won\'t be shown \
                      until you make it visible'),
      dblclick:   _t('Double click will allow you to rename it')
    },

    MODULES: ['infowindow', 'legends'],
    className: "layer_panel",

    events: {
      'click .name_info a': '_goToLayer',
      'click .info':        '_switchTo',
      'click a.visibility': '_switchVisibility',
      'click a.remove':     '_removeLayer',
      'keyup input.alias':  '_changeAlias',
      'click input.alias':  'killEvent',
      'click':              'setPanelStatus'
    },

    initialize: function() {

      cdb.admin.RightMenu.prototype.initialize.call(this);

      _.bindAll(this, '_editAlias');

      // Set internal vars
      this.table = this.model.table;
      this.sqlView = new cdb.admin.SQLViewData();
      this.map = this.options.vis.map;
      this.globalError = this.options.globalError;
      this.user = this.options.user;
      this.vis = this.options.vis;

      // Set status view model
      this.view_model = new cdb.core.Model({ state:'idle' })

      this.render();

      // Set current panel view and data layer
      this.activeWorkView = 'table';
      this.setDataLayer(this.model);

      // New added layers need to wait to get model id
      this.model.bind('change:id', function(m) {
        this.vis.save('active_layer_id', this.dataLayer.id);
        this.$el.attr('model-id', this.model.id);
      }, this);
      this.model.bind('change:type',    this._setLayerType, this);
      // Show message when layer is not visible
      this.model.bind('change:visible', this.setVisibleMsg, this);
      this.model.bind('destroy', function() {
        this.trigger('destroy', this.dataLayer.cid);
      }, this);

      // When status change binding
      this.view_model.bind('change:state', this._onChangeStatus, this);
      this.add_related_model(this.view_model);

      // Bind when panel is closed
      cdb.god.bind("panel_action", this.setPanelStatus, this);

      this.add_related_model(cdb.god);

      this.$el.attr('model-id', this.model.id);
      this._setLayerType();
    },

    /* Layer events functions */

    // Set active this tab
    _switchTo: function(e) {
      if (e) e.preventDefault();
      var isActive = this.vis.get('active_layer_id') == this.dataLayer.id;

      // Preventing problem with double click
      // over span.name
      if (isActive && $(e.target).prop("tagName").toLowerCase() == "span"
        && $(e.target).prop("className") == "name") {

        // Preventing display the tooltip when user is
        // double clicking! :(
        var self = this;
        setTimeout(function() {
          if (!self._dblClick) self.$('.layer-info .info .name').tipsy("show");
          delete self._dblClick;
        }, 150);

        return false;
      }

      this.trigger('switchTo', this);
      this.view_model.set('state', 'idle');
      this.filters._addFilters();

      return false;
    },

    _goToLayer: function(ev) {
      if (ev) {
        ev.stopPropagation();
      }
    },

    // Change view model to show table
    // name alias input
    _editAlias: function(e) {
      e.preventDefault();
      e.stopPropagation();

      if (this.vis.isVisualization()) {
        this._dblClick = true;

        this.view_model.set('state',
          this.view_model.get('state') == 'idle' ? 'editing' : 'idle'
        );
      } else {
        this.trigger('switchTo', this);
      }

      return false;
    },

    // Change layer state when input is ready
    _changeAlias: function(e) {
      var value = $(e.target).val();

      // If form is submitted, go out!
      if (e && e.keyCode == 13) {
        this.view_model.set({ state: 'idle' });
        return false;
      }
    },

    setPanelStatus: function() {
      this.view_model.set('state', 'idle');
    },

    _onChangeStatus: function() {
      var $el = this.$('.layer-info div.left');
      if (this.view_model.get('state') == "idle") {
        var alias = $el.find('input').val();
        $el.find('input').hide();
        $el.find('span.name').show();
        $el.find('.name_info').show();

        if (alias != this.view_model.get('table_name_alias')) {
          // Set new changes in model
          if (alias == "" || alias == " ") {
            this.dataLayer.unset('table_name_alias')
          } else {
            this.dataLayer.set({ table_name_alias: alias })
          }
          this.dataLayer.save();
          this.setLayerName(this.dataLayer);
        }

      } else {
        $el.find('span.name').hide();
        $el.find('.name_info').hide();
        $el.find('input')
          .val(this.dataLayer.get('table_name_alias') || this.dataLayer.get('table_name').replace(/_/g,' '))
          .show()
          .focus();
      }
    },

    _setLayerType: function() {
      this.$el.attr('layer-type', this.model.get('type').toLowerCase());
    },

    activated: function() {
      // remove layer-info
      this.deactivated();
      this.$el.html('');
      this.render();

      // Set data layer
      this.setDataLayer(this.model);

      // Set previous active layer
      this.setActivePanelView();

      this.panels.bind('tabEnabled', this.saveActivePanelView, this);
    },

    deactivated: function() {
      this.clearSubViews();
      this._removeButtons();
      this.view_model.set('state', 'idle');
    },

    // Set visibility of the map layer
    _switchVisibility: function(e) {
      e.preventDefault();

      if (!this.vis.isVisualization()) {
        cdb.log.info("You can't toggle the layer visibility in a table view");
        return false;
      }

      // Hide infowindow if it is open
      this.model.infowindow && this.model.infowindow.set('visibility', false);

      this.model.save({ 'visible': !this.model.get('visible') });
    },

    // Remove this view and the map layer
    _removeLayer: function(e) {
      e.preventDefault();

      // Check if the visualization is devired type and not table
      if (!this.vis.isVisualization()) {
        cdb.log.info("You can't remove a layer in a table view");
        return false;
      }

      this.trigger('delete', this);
    },


    /* Layer info functions (order, options, name, ...) */

    _setLayerInfo: function(layer) {
      this.setLayerName(layer);
      this.setLayerOptions(layer);
      this.setLayerOrder(layer);
      this.setVisibility(layer);
      this.setVisibleMsg(layer);
      this.setView(layer);
    },

    // Set view options
    setView: function(layer) {
      this.$el[ this.vis.isVisualization() ? 'addClass' : 'removeClass' ]('vis')
    },

    setVisibleMsg: function() {
      var editors = ['sql_mod', 'cartocss_mod'];

      // Remove message
      this.$('.layer-views div.info.warning').remove()

      // Add message if it is necessary
      if (!this.model.get('visible')) {
        var $div = $('<div>')
          .addClass('info warning')
          .append('<p>' + this._TEXTS.visible + '</p>');

        var isEditor = _.contains(editors, this.currentPanelView);
        $div[ isEditor ? 'addClass' : 'removeClass' ]('editor');
        this.$('.layer-views').append($div);
      }
    },

    // Layer name
    setLayerName: function(layer) {
      if (this.vis.isVisualization()) {

        // table name
        this.$('.layer-info .info .name')
          .text(layer.get('table_name_alias') || layer.get('table_name').replace(/_/g,' '));

        // table name alias
        var layerUrl = layer.table && layer.table.viewUrl();
        this.$('.layer-info .info .name_info')
          .html('view of ')
          .append($('<a>').text(layer.get('table_name')));
      } else {
        // Unset tipsy bind
        this._unsetLayerTooltip();
        this.$('.layer-info .info .name').text(layer.get('table_name'));
      }
    },

    _setLayerTooltip: function() {
      var self = this;
      this.$('.layer-info .info .name').tipsy({
        trigger:  'manual',
        fade:     true,
        gravity:  's',
        title:  function() {
          return self._TEXTS.dblclick
        }
      })
      .bind('mouseleave', function() {
        $(this).tipsy('hide');
      });
    },

    _unsetLayerTooltip: function() {
      var $name = this.$('.layer-info .info .name');
      // Remove tipsy
      if ($name.data('tipsy')) {
        $name.unbind('mouseenter mouseleave');
        $name.data('tipsy').remove();
      }
    },

    // Layer options
    setLayerOptions: function(layer) {
      // Layer options buttons
      if (this.vis && !this.vis.isVisualization()) {
        this.$('.layer-info div.right').hide();
      } else {
        this.$('.layer-info div.right').show();
      }
    },

    setVisibility: function(layer) {
      this._maybeHideVisibilitySwitch();

      var isVisible = layer.get('visible');
      this.$(".layer-info div.right a.switch")
        .toggleClass('enabled', !!isVisible)
        .toggleClass('disabled', !isVisible);
    },

    _maybeHideVisibilitySwitch: function() {
      var sw = this.$(".layer-info div.right a.switch");
      var close = this.$(".layer-info div.right a.remove");
      var dataLayers = this.vis.map.layers.getDataLayers();
      if (dataLayers.length === 1) {
        sw.hide();
        close.hide();
      } else {
        sw.css('display', 'inline-block');
        close.css('display', 'inline-block');
      }
    },

    // Layer order
    setLayerOrder: function(layer) {
      var order = '1';
      if(this.vis.isVisualization()) {
        order = layer.collection.indexOf(layer);
      }

      this.$('.layer-info .info .order').text(order);
    },


    /* Set data of the layer (bindings, errors, modules, ...) */
    setDataLayer: function(dataLayer) {
      var self = this;
      this.add_related_model(dataLayer);
      var enabledModulesInit = self.MODULES;

      if (!self.dataLayer) {
        self.dataLayer = dataLayer;
        this._initDataLayer(dataLayer);
      }

      // Set layer info
      this._setLayerInfo(dataLayer);

      /* SQL */
      var sql = new cdb.admin.mod.SQL({
        model: self.dataLayer,
        user: self.user,
        className: "sql_panel editor"
      });

      /* Filters */
      this.filters = new cdb.admin.mod.Filters({
        table: self.table,
        sqlView: self.sqlView,
        dataLayer: self.dataLayer
      });

      // load the scroll when the panel is open
      cdb.god.bind("end_narrow", function() {
        self.filters.loadScroll()
      }, this);

      /* Wizards */
      var activeWizards = {
        polygon:    "SimpleWizard",
        cluster:    "ClusterWizard",
        intensity:  "IntensityWizard",
        bubble:     "BubbleWizard",
        choropleth: "ChoroplethWizard",
        color:      "CategoryWizard",
        category:   "CategoryWizard",
        density:    "DensityWizard",
        torque:     "TorqueWizard",
        torque_cat:  "TorqueCategoryWizard",
        torque_heat: "TorqueHeatWizard"
      };


      var wizards = new cdb.admin.mod.CartoCSSWizard({
        user: this.user,
        model: this.dataLayer,
        table: this.table,
        map: this.map,
        className: "wizards_panel",
        wizards: activeWizards
      }).bind('modules', function(enabledModules) {
        enabledModulesInit = enabledModules;
        this.enableModules(enabledModules);
      }, this).bind('activeWizard', function(type) {
        // Close infowindow if it exists.
        this.dataLayer.infowindow && this.dataLayer.infowindow.set('visibility', false);
      }, this);

      /* Infowindow */
      var infowindow = this.infowindow = new cdb.admin.mod.InfoWindow({
        table: this.table,
        user: this.user,
        dataLayer: dataLayer
      });
      infowindow.bind('tabChanged', this._onModuleTabChanged, this);

      /* CartoCSS editor */
      var editorPanel = new cdb.admin.mod.CartoCSSEditor({
        model: this.dataLayer,
        table: this.table,
        user: this.user,
        className: "csseditor_panel editor"
      }).bind('hasErrors', function() {
        self.addClassToButton('cartocss_mod', 'has_errors');
      }).bind('clearError', function() {
        self.removeClassFromButton('cartocss_mod', 'has_errors');
      });

      /* Legends */
      var legends = new cdb.admin.mod.LegendEditor({
        model: dataLayer.legend,
        dataLayer: dataLayer,
        className: "legends_panel",
        availableLegends: [
          { name: "none",       enabled: true  },
          { name: "custom",     enabled: true  },
          { name: "color",      enabled: false },
          { name: "category",   enabled: false },
          { name: "bubble",     enabled: false },
          { name: "choropleth", enabled: false },
          { name: "intensity",  enabled: false },
          { name: "density",    enabled: false },
          { name: "torque_cat", enabled: false }
        ],
      }).bind('modules', function(enabledModules) {
        enabledModulesInit = enabledModules;
        self.enableModules(enabledModules);
      }).bind('tabChanged', this._onModuleTabChanged, this);

      if (!this.user.featureEnabled('disabled_ui_sql')) {
        self.addModule(sql.render(), ['table', 'tableLite', 'map', 'mapLite']);
      }
      self.addModule(wizards.render(),      ['map', 'mapLite']);
      self.addModule(infowindow.render(),   ['map', 'mapLite']);
      if (!this.user.featureEnabled('disabled_ui_cartocss')) {
        self.addModule(editorPanel.render(), ['map', 'mapLite']);
      }
      self.addModule(legends.render(),      ['map', 'mapLite']);
      self.addModule(this.filters.render(), ['table', 'tableLite', 'map', 'mapLite']);

      /* Lateral menu modules */
      var mergeTables = self.addToolButton("merge_datasets", 'table');
      //var addRow      = self.addToolButton('add_row', 'table');
      //var addColumn   = self.addToolButton('add_column', 'table');
      var addGeom     = self.addToolButton('add_feature', 'map');

      //addRow.bind('click', this._addRow, this);
      //addColumn.bind('click', this.trigger.bind(this, 'addColumn', this));
      mergeTables.bind('click', this._mergeTables, this);
      addGeom.bind('click', this._addFeature, this);

      this.enableModules(enabledModulesInit);
      this._bindDataLayer();
    },

    // set initial parameters to the layer
    _initDataLayer: function(layer) {
      layer.bind('change:table_name', this.setLayerName, this);
      layer.bind('change:order',      this.setLayerOrder, this);
      layer.bind('change:visible',    this.setVisibility, this);

      layer.collection.bind('add remove', this._maybeHideVisibilitySwitch, this);
      this.add_related_model(layer.collection);

      layer.set({
        stat_tag: this.vis.get('id'),
        user_name: this.user.get("username"),
        maps_api_template: cdb.config.get('maps_api_template'),
        cartodb_logo: false,
        no_cdn: false,
        force_cors: true // use CORS to control error management in a better way
      });

      // set api key
      var e = layer.get('extra_params') || {};
      e.api_key = e.map_key = this.user.get('api_key');
      layer.set('extra_params', e);
      layer.invalidate();
    },

    // bind related ui changed to datalayer
    _bindDataLayer: function() {
      var self = this;
      this.dataLayer.bindSQLView(this.sqlView);
      this.dataLayer
        .bind('parseError', function() {
          if(self.activeWorkView === 'map') {
            self.globalError.showError('There is a problem with the map tiles. Please, check your CartoCSS style.', 'error', 0, 'tiles');
          }
        }, this)
        .bind('sqlNoMercator', function() {
          if(self.activeWorkView === 'map') {
            // don't show this error, the warning is shown in the sql bar
            //self.globalError.showError(_t('the_geom_webmercator column should be selected'), 'warn', 0, 'tiles');
          }
        }, this)
        .bind('error', function(model, resp) {
          var aborted = resp && resp.statusText === 'abort';
          if(self.activeWorkView === 'map' && !aborted) {
            self.globalError.showError('There is a problem with your connection', 'error', 0, 'tiles');
          }
        }, this)
        .bind('tileOk', function() {
          self.globalError.hide('tiles');
        }, this);

      this.table.bind('columnRename columnDelete columnAdded geolocated', function() {
        self.dataLayer.invalidate();
      }, this);

      this.table.bind('change:geometry_types', function() {
        if(this.table.get('geometry_types').length) {
          this._enableGeometryRelatedWizards();
        } else {
          this._disableGeometryRelatedWizards();
        }
      }, this);

      // Need to check buttons when permission changes
      this.table.bind('change:permission',  this._checkButtons, this);
      this.table.bind('change:readOnly', this._checkButtons, this);
      this.table.bind('change:synchronization', this._checkButtons, this);
      this.table.bind('change:isSync', this._checkButtons, this);

      this.vis.bind('change:type', function() {
        this.setLayerOptions()
        this.setLayerName(this.model)
      }, this);

      this.model.bind('applySQLView errorSQLView clearSQLView', this._checkButtons, this);

      // this.model.bind('clearSQLView', this._onResetSQL, this);
      // this.model.bind('applySQLView', this._onApplySQL, this);
      // this.model.bind('errorSQLView', this._onErrorSQL, this);

      this.model.unbind('applyFilter', this._applyFilter, this);
      this.model.bind('applyFilter',  this._applyFilter, this);

      // Add related models to be cleaned when view is destroyed
      this.add_related_model(this.vis);
      this.add_related_model(this.table);

      this._checkButtons();
    },

    enableModules: function(enabledModules) {

      var self = this;

      _(self.MODULES).each(function(m) {

        if (m === "infowindow" && !self.model.wizard_properties.supportsInteractivity()) {
          self.disableModule("infowindow_mod");
        } else {

          if (_.contains(enabledModules, m)) {
            self.enableModule(m + "_mod");
          } else {
            self.disableModule(m + "_mod");
          }

        }

      });

    },

    SQL_WIZARDS: ['cartocss_mod', 'wizards_mod', 'infowindow_mod', 'legends_mod'],

    _disableGeometryRelatedWizards: function() {
      var self = this;
      _(this.SQL_WIZARDS).each(function(m) {
        self.disableModule(m);
      });
    },

    _enableGeometryRelatedWizards: function() {
      var self = this;

      _(this.SQL_WIZARDS).each(function(m) {

        if (m == 'infowindow_mod' && !self.model.wizard_properties.supportsInteractivity()) {
          self.disableModule(m);
        } else {
          self.enableModule(m);
        }

      });

    },

    _addRow: function() {
      this.table.data().addRow({ at: 0});
      this.trigger('createRow');
      cdb.god.trigger("closeDialogs");
    },

    _mergeTables: function() {
      var user = this.user;
      var view = new cdb.editor.MergeDatasetsView({
        table: this.table,
        user: user
      });
      view.appendToBody();
      cdb.god.trigger("closeDialogs");
    },

    _addFeature: function(mod) {
      if (this.map.get('provider') === 'leaflet') {
        this.map.clamp();
      }
      if (this.table.isGeoreferenced()) {
        this._addGeometry();
      } else {
        this._showScratchDialog();
      }
    },

    _showScratchDialog: function() {
      var view = new cdb.editor.ScratchView({
        clean_on_hide: true,
        enter_to_confirm: true,
        table: this.table,
        skipDisabled: true
      });
      view.bind("newGeometry", this._addGeometry, this);
      view.appendToBody();
    },

    _addGeometry: function(type) {
      // row is saved by geometry editor if it is needed
      type = type || this.table.geomColumnTypes()[0];
      this.dataLayer.trigger("startEdition", type);
    },

    /* Module functions */

    // When a tab is activated within a sub-module.
    // It could be the indowindow view, filters view, etc.
    _onModuleTabChanged: function(action) {
      this.trigger('tabChanged', action);
    },

    // check buttons if they should be enabled or not
    _checkButtons: function() {
      var self = this;
      var gt = this.table.get('geometry_types');

      // Changes over the SQL button
      var sql_button_changes = {
        applied:    'remove',
        has_errors: 'remove'
      };

      // *Table with read permissions* //
      if (this.table.isReadOnly()) {

        // Data layer has a query applied?
        if (this.table.isInSQLView()) {
          if(this.model.getCurrentState() === 'error') {
            sql_button_changes = {
              applied: 'add',
              has_errors: 'add'
            }
          } else {
            sql_button_changes.applied = 'add';
          }
        }

        // Check if there is any geometry
        if (gt && gt.length === 0) {
          this._disableGeometryRelatedWizards();
        } else {
          this._enableGeometryRelatedWizards();
        }

        this._readOnlyTableButtons();
      } else {
        // *Table with write permissions* //

        // Check if there is any geometry
        if(gt && gt.length === 0) {
          this._disableGeometryRelatedWizards();
        } else {
          this._enableGeometryRelatedWizards();
        }

        // Enable writable buttons
        this._writableTableButtons();
      }

      // Set title changes (as in name, sync info,...)
      this.setLayerName(this.dataLayer);

      // Set sql button changes
      _.each(sql_button_changes, function(value, key) {
        self[ value === "remove" ? 'removeClassFromButton' : 'addClassToButton' ]('sql_mod', key);
      });
    },

    _removeButtons: function() {
      this.buttons = [];
      this.panels.unbind('tabEnabled', this.saveActivePanelView, this);
      this.panels.clean();
      this.tabs.clean();
    },

    // Enable the correct buttons depending on
    // if the layer is in query mode or not
    setActiveWorkView: function(workView) {
      this.activeWorkView = workView;
      this._checkButtons();
      this.setActivePanelView(true);
    },

    saveActivePanelView: function(name) {
      this.currentPanelView = name;
      this.setVisibleMsg();
    },

    setActivePanelView: function(work_view) {
      if (work_view || !this.currentPanelView) {
        if (this.activeWorkView === 'map') {
          var gt = this.table.get('geometry_types');
          if(this.model.getCurrentState() !== 'error' && (gt && gt.length > 0)) {
            this.active('wizards_mod');
          }
        } else {
          this.active('sql_mod');
        }
      } else {
        this.active(this.currentPanelView);
      }
    },

    _readOnlyTableButtons: function() {
      if(this.activeWorkView === 'map') {
        this.showTools('mapLite', true);
      } else {
        this.showTools('tableLite', true);
      }
    },

    _writableTableButtons: function() {
      if(this.activeWorkView === 'map') {
        this.showTools('map', true);
      } else {
        this.showTools('table', true);
      }
    },

    _applyFilter: function(column_name) {

      var col = { column: column_name };

      var exists = this.filters.filters.find(function(a) {
        return a.get("column") == col.column
      });

      if (!exists) this.filters.filters.add(col);

    },


    /* View visibility functions */

    hide: function() {
      this.$('.layer-sidebar').hide();
      this.$('.layer-views').hide();
    },

    show: function() {
      this.$('.layer-sidebar').show();
      this.$('.layer-views').show();
    },

    showModule: function(modName, modTab) {
      // Set tab in the module
      if (modTab && this[modName]) this[modName].setActiveTab(modTab);
      // Show module
      this.trigger('show', modName + "_mod", this);
    },

    clean: function() {
      this._unsetLayerTooltip();
      this._removeButtons();
      this.elder('clean');
    }
  });
