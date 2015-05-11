
  /**
   *  Pane for select/import an already created layer
   *
   *  new cdb.admin.ImportLayerPane({
   *    user: user_model
   *  })
   */

  cdb.admin.ImportLayerPane = cdb.admin.ImportPane.extend({
    
    className: "import-pane import-layer-pane",

    initialize: function() {
      this.tables = new cdb.admin.Visualizations();
      this.user = this.options.user;
      
      this.model = new cdb.core.Model({
        type:       'layer',
        value:      '',
        table_name: '',
        interval:   '0',
        valid:      false
      });

      this.template = cdb.templates.getTemplate(this.options.template || 'old_common/views/import/import_layer');

      this.render();

      this._fetchTables();

      this._initBinds();
    },

    render: function() {
      this.clearSubViews();

      this.$el.append(this.template());

      this._initViews();

      return this;
    },

    _initViews: function() {
      // Select the correct combo/selector depending if
      // the user belongs to an organization or not
      var comboClass = cdb.ui.common.VisualizationsSelector;
      
      // if (this.user.isInsideOrg()) {
      //   comboClass = cdb.admin.SharedTablesCombo;
      // }

      this.tableCombo = new comboClass({
        model:  this.tables,
        user:   this.user
      });

      this.tableCombo.bind('change', this._onTableSelected, this)
      this.$('.tableListCombo').append(this.tableCombo.render().el);
      this.addView(this.tableCombo);
    },

    _initBinds: function() {
      this.model.bind('change', this._onValueChange, this);
    },

    _fetchTables: function(tables) {
      this.tables.options.set({ type: 'table', per_page:100000, table_data: false });
      var order = { data: { o: { updated_at: "desc" }, exclude_raster: true }};

      this.tables.bind('reset', this._onTablesFetched,  this);
      this.tables.bind('error', this._onTablesError,    this);
      this.tables.fetch(order);
      this.add_related_model(this.tables);
    },

    _onTablesFetched: function() {
      this.tables.unbind(null, null, this);

      // Show list and hide loader + error warning
      this._toggleElements(['span.loader', 'p.warning.error'], false, true);
      this._showTablesList();
    },

    _onTablesError: function() {
      this._toggleElements(['span.loader'], false, true);
      this._removeTablesList();
      this._toggleElements(['p.warning.error'], true, false);
    },

    _onTableSelected: function(table_data) {
      if (!table_data) return;

      var self = this;

      // Remove all warnings
      this._toggleElements(['p.warning.geo'], false, false);

      // Get table from tables collection
      var table_vis = this.tables.find(function(table){ return table.get('name') == table_data.name; });

      // Check if table has any georeference data and warn the user :S
      var table_metadata = new cdb.admin.CartoDBTableMetadata({ id: table_vis.get("table").id });
      table_metadata.fetch({
        success: function(m) {
          // Check if actual table is the same requested
          var selectedTable = self.tableCombo.getSelected();
          if (selectedTable && selectedTable.name == m.get('name') && m.statsGeomColumnTypes().length == 0) {
            self._toggleElements(['p.warning.geo'], true, false);
          }
        }
      });

      this._getTableName(table_data);
    },

    // Get table name (qualified if it is necessary) and set the model with this value
    _getTableName: function(table_data) {
      var vis = this.tables.find(function(i) { return i.id === table_data.vis_id });

      if (vis) {
        var table_name = vis.get('table').name || table_data.name;
        this.model.set({
          value:      table_name,
          table_name: table_name,
          valid:      true
        });
      } 
    },

    _toggleElements: function(selectors, show, animation) {
      var self = this;
      _.each(selectors, function(el) {
        if (animation) {
          self.$(el)
            [ show ? 'slideDown' : 'slideUp' ]('slow')
            .animate(
              { opacity: show ? 1 : 0 },
              { queue: false, duration: 'slow' }
            );
        } else {
          self.$(el)[ show ? 'show' : 'hide' ]()
        }
      });
    },

    _showTablesList: function() {
      this.$('.options').css('opacity', 1);
      this.$('p.message').fadeIn();
      this.$('.combo_wrapper').fadeIn();
    },

    _removeTablesList: function() {
      this.$('.options ul.options').remove()
    },

    _onValueChange: function() {
      this.trigger('valueChange', this.model.toJSON(), this);
    }

  });
