
cdb.admin.ActionsMenu = cdb.admin.RightMenu.extend({


    initialize: function() {
      cdb.admin.RightMenu.prototype.initialize.call(this);
      this.table = this.options.table;
      this.sqlView = this.options.sqlView;
      this.map = this.options.map;
      this.infowindow = this.options.infowindow;
    },

    setDataLayer: function(dataLayer) {
      var self = this;
      self.dataLayer = dataLayer;

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

      addRow.bind('click', function() {
        self.table.data().addRow({ at: 0});
        self.trigger('createRow');
        cdb.god.trigger("closeDialogs");
      });

      addColumn.bind('click', function() {
        new cdb.admin.NewColumnDialog({
          table: self.table
        }).appendToBody().open();
        cdb.god.trigger("closeDialogs");
      });

      mergeTables.bind('click', function() {
        new cdb.admin.MergeTablesDialog({
          model: self.table
        }).appendToBody().open({ center:true });
        cdb.god.trigger("closeDialogs");
      });

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

