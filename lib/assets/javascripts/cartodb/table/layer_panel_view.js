  
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
      remove: {
        title:  _t('Delete this layer'),
        desc:   _t('You are about to delete this layer. Doing so won\'t remove your table, \
                only this visualization will be affected.'),
        ok:     _t('Delete layer'),

      },
      error:  {
        default: _t('Something went wrong, try again later')
      }
    },

    MODULES: ['infowindow'],
    className: "layer_panel",

    events: {
      'click a.info':       '_switchTo',
      'click a.visibility': '_setVisibility',
      'click a.remove':     '_removeLayer'
    },

    initialize: function() {
      cdb.admin.RightMenu.prototype.initialize.call(this);

      // Set internal vars
      this.table = this.model.table;
      this.sqlView = new cdb.admin.SQLViewData();
      this.map = this.options.vis.map;
      this.globalError = this.options.globalError;
      this.user = this.options.user;
      this.vis = this.options.vis;

      this.render();

      // Set data layer
      this.setDataLayer(this.model);
      this.activeWorkView = 'table';

      // Bindings
      this.model.bind('destroy', this.clean, this);
      this.vis.bind('change:type', this.setLayerOptions);
      
      // Add this related model to be cleaned when view is destroyed
      this.add_related_model(this.vis);
    },


    /* Layer events functions */

    // Set active this tab
    _switchTo: function(e) {
      e.preventDefault();
      this.vis.save('active_layer_id', this.dataLayer.id);
      this.trigger('switchTo', this);
    },

    // Set visibility of the map layer
    _setVisibility: function(e) {
      this.killEvent(e);
      this.model.set('visible', !this.model.get('visible'));
      $(e.target).closest("a.switch")
        .removeClass('enabled disabled')
        .addClass(this.model.get('visible') ? 'enabled' : 'disabled');
    },

    // Remove this view and the map layer
    _removeLayer: function(e) {
      this.killEvent(e);

      // Check if the visualization is devired type and not table
      if (!this.vis.isVisualization()) {
        cdb.log.info("You can't remove a layer in table view");
        return false;
      }

      var self = this;
      var dlg = new cdb.admin.BaseDialog({
        title: self._TEXTS.remove.title,
        description: self._TEXTS.remove.desc,
        template_name: 'common/views/confirm_dialog',
        clean_on_hide: true,
        enter_to_confirm: true,
        ok_button_classes: "right button grey",
        ok_title: self._TEXTS.remove.ok,
        cancel_button_classes: "underline margin15",
        modal_type: "confirmation",
        width: 500
      });

      // If user confirms, app removes this panel view,
      // including the map layer
      dlg.ok = function() {
        self.model.destroy({
          success: function(r) {
            self.clean();
          },
          error: function(e) {
            self.globalError.showError(self._TEXTS.error.default, 'error', 3000);
          }
        });
      }

      dlg
        .appendToBody()
        .open();
    },


    /* Layer info functions (order, options, name, ...) */
    
    _setLayerInfo: function(layer) {
      this.setLayerName(layer);
      this.setLayerOptions(layer);
      this.setLayerOrder(layer);
    },

    // Layer name
    setLayerName: function(layer) {
      this.$('.layer_info a.info .name').text(layer.get('table_name'));
    },

    // Layer options
    setLayerOptions: function(layer) {
      // Layer options buttons
      if (this.vis && this.vis.get('type') == "table") {
        this.$('.layer_info div.right').hide();
      } else {
        this.$('.layer_info div.right').show();
      }
    },

    // Layer order
    setLayerOrder: function(layer) {
      this.$('.layer_info a.info .order').text(layer.get('order'));
    },


    /* Set data of the layer (bindings, errors, modules, ...) */

    setDataLayer: function(dataLayer) {
      var self = this;
      var enabledModulesInit = self.MODULES;
      self.dataLayer = dataLayer;
      this._initDataLayer(self.dataLayer);

      /* SQL */
      var sql = new cdb.admin.mod.SQL({
        model: self.dataLayer,
        sqlView: self.sqlView,
        table: self.table
      }).bind('clearSQLView', function() {
        self.removeClassFromButton('sql_mod', 'applied');
        self._clearSQLView();
      }).bind('hasErrors', function() {
        self.addClassToButton('sql_mod', 'has_errors');
      }).bind('clearError', function() {
        self.removeClassFromButton('sql_mod', 'has_errors');
      }).bind('applyQuery', function(sql) {
        self.addClassToButton('sql_mod', 'applied');
        self._applySQLView(sql);
      }, self);

      /* Wizards */
      var activeWizards = {
        polygon:    "SimpleWizard",
        intensity:  "IntensityWizard",
        bubble:     "BubbleWizard",
        choropleth: "ChoroplethWizard",
        density:    "DensityWizard"
      };

      var wizards = new cdb.admin.mod.CartoCSSWizard({
        model: self.dataLayer, // datalayer
        table: self.table,
        map: self.map,
        className: "wizards_panel",
        wizards: activeWizards
      }).bind('modules', function(enabledModules) {
        enabledModulesInit = enabledModules;
        self.enableModules(enabledModules);
      });

      /* Infowindow */
      var infowindow = new cdb.admin.mod.InfoWindow({
        table: self.table,
        model: dataLayer.infowindow
      });

      /* CartoCSS editor */
      var editorPanel = new cdb.admin.mod.CartoCSSEditor({
        model: self.dataLayer, // dataLayer
        table: self.table,
        className: "csseditor_panel"
      }).bind('enable', function(type) {
        self.changeWithin(type);
      }).bind('hasErrors', function() {
        self.addClassToButton('cartocss_mod', 'has_errors');
      }).bind('clearError', function() {
        self.removeClassFromButton('cartocss_mod', 'has_errors');
      });

      self.addModule(sql.render(), ['table', 'tableLite', 'map', 'mapLite']);
      self.addModule(wizards.render(), ['map', 'mapLite']);
      self.addModule(infowindow.render(), ['map', 'mapLite']);
      self.addModule(editorPanel.render(), ['map', 'mapLite']);

      /* Lateral menu modules */
      var mergeTables = self.addToolButton("merge_tables", 'table');
      var addRow = self.addToolButton('add_row', 'table');
      var addColumn = self.addToolButton('add_column', 'table');

      addRow.bind('click', this._addRow, this);
      addColumn.bind('click', this._addColumn, this);
      mergeTables.bind('click', this._mergeTables, this);

      this.enableModules(enabledModulesInit);
      this._bindDataLayer();
    },

    // set initial parameters to the layer
    _initDataLayer: function(layer) {
      layer.bind('change:table_name', this.setLayerName, this);
      layer.bind('change:order',      this.setLayerOrder, this);

      this._setLayerInfo(layer);

      layer.set({
        user_name: this.user.get("username"),
        sql_api_domain: cdb.config.get('sql_api_domain'),
        sql_api_endpoint: cdb.config.get('sql_api_endpoint'),
        sql_api_port: cdb.config.get('sql_api_port'),
        tiler_domain: cdb.config.get('tiler_domain'),
        tiler_port: cdb.config.get('tiler_port'),
        no_cdn: true
      });
      
      // set api key
      var e = layer.get('extra_params') || {};
      e.map_key = this.user.get('api_key');
      layer.set('extra_params', e);
      layer.invalidate();
    },

    // bind related ui changed to datalayer
    _bindDataLayer: function() {
      var self = this;
      self.dataLayer.bindSQLView(this.sqlView);
      self.dataLayer
        .bind('tileError parseError', function() {
          if(self.activeWorkView == 'map') {
            self.globalError.showError('There is a problem with the map tiles. Please, check your CartoCSS style.', 'error', 0);
          }
        }, self.globalError)
        .bind('error', function() {
          if(self.activeWorkView == 'map') {
            self.globalError.showError('There is a problem with your connection', 'error', 0);
          }
        }, self.globalError)
        .bind('tileOk', function() {
          self.globalError.hide();
        }, this);

        self.table.bind('columnRename columnDelete columnAdded geolocated', function() {
          self.dataLayer.invalidate();
        });

        self.sqlView.bind('reset', function() {
          if(!self.sqlView.modify_rows) {
            self._readOnlyTableButtons();
          }
        });
    },

    _applySQLView: function(sql) {
      var self = this;
      self.table.useSQLView(self.sqlView);
      self.sqlView.setSQL(sql, { silent: true });
      // if there is some error the query is rollbacked
      self.sqlView.fetch();
    },

    _clearSQLView: function() {
      this.dataLayer.save({ query: undefined });
      this.dataLayer.addToHistory("query", "SELECT * FROM " + this.table.get('name'));
      this._writableTableButtons();
      this.removeClassFromButton('sql_mod', 'has_errors');
      this.table.useSQLView(null);
    },

    enableModules: function(enabledModules) {
      var self = this;
      _(self.MODULES).each(function(m) {
        if(_.contains(enabledModules, m)) {
          self.enableModule(m + "_mod");
        } else {
          self.disableModule(m + "_mod");
        }
      });
    },

    _addRow: function() {
      this.table.data().addRow({ at: 0});
      this.trigger('createRow');
      cdb.god.trigger("closeDialogs");
    },

    _addColumn: function() {
      new cdb.admin.NewColumnDialog({
        table: this.table
      }).appendToBody().open();
      cdb.god.trigger("closeDialogs");
    },

    _mergeTables: function() {
      new cdb.admin.MergeTablesDialog({
        table: this.table
      }).appendToBody().open({ center:true });
      cdb.god.trigger("closeDialogs");
    },


    /* Module functions */

    // Enable the correct buttons depending on
    // if the layer is in query mode or not
    setActiveWorkView: function(workView) {
      this.activeWorkView = workView;
      if(this.table.isInSQLView()) {
        this._readOnlyTableButtons();
      } else {
        this._writableTableButtons();
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


    /* View visibility functions */

    hide: function() {
      this.$('.sidebar').hide();
      this.$('.views').hide();
    },

    show: function() {
      this.$('.sidebar').show();
      this.$('.views').show();
    }
  });