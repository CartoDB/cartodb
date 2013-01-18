
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
    this.map.layers.bind('reset', this._addLayers, this);

    this.isOpen = true;
    this.activeSection = 'table';
  },

  _addLayers: function(layers) {
    var self = this;
    layers.each(function(l) {
      self._addLayer(l)
    });
  },

  _addLayer: function(layer) {
    if(layer.get('type') == 'CartoDB') {
      var v = new cdb.admin.LayerPanelView({
        model: layer,
        sqlView: this.options.sqlView,
        table: this.options.table,
        map: this.map
      });
      v.bind('toggle', this.toggle, this);
      this.addTab(layer.cid, v);
      v.showTools(this.activeSection);
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

  showTools: function(tools) {
    this.hide();
    this.activeSection = tools;
    var p = this.getActivePane()
    if(p) {
      p.showTools(tools);
    }
  }

});

cdb.admin.LayerPanelView = cdb.admin.RightMenu.extend({

    MODULES: ['infowindow'],

    initialize: function() {
      cdb.admin.RightMenu.prototype.initialize.call(this);
      this.table = this.options.table;
      this.sqlView = this.options.sqlView;
      this.map = this.options.map;
      this.infowindow = new cdb.geo.ui.InfowindowModel({
        template_name: 'table/views/infowindow_light'
      });
      this.render();
      this.setDataLayer(this.model);
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

    setDataLayer: function(dataLayer) {
      var self = this;
      var enabledModulesInit = self.MODULES;
      self.dataLayer = dataLayer;
      
      this._initInfowindow();

      /* SQL */
      var sql = new cdb.admin.mod.SQL({
        model: self.dataLayer,
        sqlView: self.sqlView,
        table: self.table
      }).bind('clearSQLView', function() {
        self.dataLayer.save({ query: undefined });
        self.dataLayer.addToHistory("query", "SELECT * FROM " + self.table.get('name'));
        self.removeClassFromButton('sql_mod', 'has_errors');
        // let's restore the edition buttons
        self._writableTableButtons();
      }).bind('hasErrors', function() {
        self.addClassToButton('sql_mod', 'has_errors');
      }).bind('clearError', function() {
        self.removeClassFromButton('sql_mod', 'has_errors');
      }).bind('writeSQL', function(sql) {
        self.trigger('applyQuery', sql);
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
    }

});

