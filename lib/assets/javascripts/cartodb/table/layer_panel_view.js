
cdb.admin.LayerPanelView = cdb.admin.RightMenu.extend({

    MODULES: ['infowindow'],
    className: "layer_panel",

    events: {
      'click a.info': '_switchTo'
    },

    initialize: function() {
      cdb.admin.RightMenu.prototype.initialize.call(this);
      this.table = this.options.table;
      this.sqlView = new cdb.admin.SQLViewData();
      this.map = this.options.map;
      this.globalError = this.options.globalError;
      this.user = this.options.user;
      this.infowindow = new cdb.geo.ui.InfowindowModel({
        template_name: 'table/views/infowindow_light'
      });
      this.render();
      this.setDataLayer(this.model);
    },

    _switchTo: function() {
      this.trigger('switchTo', this);
    },

    _initInfowindow: function() {
      var self = this;
      var infowindowData = self.dataLayer.get('infowindow');
      if(infowindowData) {
        self.infowindow.set(infowindowData);
      } else {
        // assign a position from start
        var pos = 0;
        _(self.table.get('schema')).each(function(v) {
          if(!_.contains(['the_geom', 'created_at', 'updated_at', 'cartodb_id'], v[0])) {
            self.infowindow.addField(v[0], pos);
            ++pos;
          }
        });
      }
      self.infowindow.bind('change:fields change:template_name', _.debounce(function() {
        // call with silent so the layer is no realoded
        // if some view needs to be changed when infowindow is changed it should be
        // subscribed to infowindow model not to dataLayer
        // (which is only a data container for infowindow)
        self.dataLayer.save({ infowindow: self.infowindow.toJSON() }, { silent: true });
      }, 10));
    },

    // set initial parameters to the layer
    _initDataLayer: function(layer) {
      layer.bind('change:table_name', this._setInfoLayer, this);
      this._setInfoLayer(layer);

      layer.set({
        table_name: this.table.get('name'),
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

    // Set info of the layer
    _setInfoLayer: function(layer) {
      // Layer name
      this.$('.layer_info a.info .name').text(layer.get('table_name'));
      // Layer order
      this.$('.layer_info a.info .order').text(layer.get('order'));
    },

    _clearSQLView: function() {
      this.dataLayer.save({ query: undefined });
      this.dataLayer.addToHistory("query", "SELECT * FROM " + this.table.get('name'));
      this._writableTableButtons();
      this.removeClassFromButton('sql_mod', 'has_errors');
      this.table.useSQLView(null);
    },

    setDataLayer: function(dataLayer) {
      var self = this;
      var enabledModulesInit = self.MODULES;
      self.dataLayer = dataLayer;
      this._initDataLayer(self.dataLayer);

      this._initInfowindow();

      /* SQL */
      var sql = new cdb.admin.mod.SQL({
        model: self.dataLayer,
        sqlView: self.sqlView,
        table: self.table
      }).bind('clearSQLView', function() {
        self._clearSQLView();
      }).bind('hasErrors', function() {
        self.addClassToButton('sql_mod', 'has_errors');
      }).bind('clearError', function() {
        self.removeClassFromButton('sql_mod', 'has_errors');
      }).bind('applyQuery', function(sql) {
        self.applyQuery(sql);
      }, self);

      var wizards = new cdb.admin.mod.CartoCSSWizard({
        model: self.dataLayer, // datalayer
        table: self.table,
        map: self.map,
        className: "wizards_panel"
      }).bind('modules', function(enabledModules) {
        enabledModulesInit = enabledModules;
        self.enableModules(enabledModules);
      });

      /* Infowindow */
      var infowindow = new cdb.admin.mod.InfoWindow({
        table: self.table,
        model: self.infowindow
      });

      // cartocss editor
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

      // Lateral menu modules
      var mergeTables = self.addToolButton("merge_tables", 'table');
      var addRow = self.addToolButton('add_row', 'table');
      var addColumn = self.addToolButton('add_column', 'table');

      addRow.bind('click', this._addRow, this);
      addColumn.bind('click', this._addColumn, this);
      mergeTables.bind('click', this._mergeTables, this);

      this.enableModules(enabledModulesInit);

      this._bindDataLayer();

    },


    // bind related ui changed to datalayer
    _bindDataLayer: function() {
      var self = this;
      self.dataLayer.bindSQLView(this.sqlView);
      self.dataLayer
        .bind('tileError parseError', function() {
          /*
          if(self.workView.activeTab == 'map') {
            self.globalError.showError('There is a problem with the map tiles. Please, check your CartoCSS style.', 'error', 0);
          }
          */
        }, self.globalError)
        .bind('error', function() {
          /*
          if(self.workView.activeTab == 'map') {
            self.globalError.showError('There is a problem with the tiles server.', 'error', 0);
          }
          */
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

    applyQuery: function(sql) {
      var self = this;
      self.table.useSQLView(self.sqlView);
      self.sqlView.setSQL(sql, { silent: true });
      // if there is some error the query is rollbacked
      self.sqlView.fetch();
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
        model: this.table
      }).appendToBody().open({ center:true });
      cdb.god.trigger("closeDialogs");
    },

    _readOnlyTableButtons: function() {
      if(this.activeSection === 'map' || this.activeSection === 'mapLite') {
        this.showTools('mapLite', true);
      } else {
        this.showTools('tableLite', true);
      }
    },

    _writableTableButtons: function() {
      if(this.activeSection === 'map' || this.activeSection === 'mapLite') {
        this.showTools('map', true);
      } else {
        this.showTools('table', true);
      }
    },

    hide: function() {
      this.$('.sidebar').hide();
      this.$('.views').hide();
    },

    show: function() {
      this.$('.sidebar').show();
      this.$('.views').show();
    }


});

