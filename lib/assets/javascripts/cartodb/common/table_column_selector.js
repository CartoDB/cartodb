  /**
   *  Column selector
   */

  cdb.admin.ColumnSelectorModel = cdb.core.Model.extend({});


  cdb.admin.ColumnSelector = cdb.core.View.extend({

    tagName: 'li',

    events: {
      'click a.radiobutton':  '_onRadioClick',
      'click a.switch':       '_onSwitchClick'
    },

    initialize: function() {
      _.bindAll(this, '_onJoinTypeChange', '_onColumnSelectedChange', '_onRadioClick');

      this.model.bind("change:joinType",        this._onJoinTypeChange);
      this.model.bind("change:columnSelected",  this._onColumnSelectedChange);
      this.model.bind("change:keySelected",     this._onRadioClick);

      // Flag to know if column could be key or not
      this.enabled = this._setKeyColumnEnabled();
    },

    render: function() {
      this.$el.html('');
      var $content = $(cdb.templates.getTemplate('common/views/column_selector')(this.model.toJSON()));
      this.$el.append($content);
      return this;
    },

    _onJoinTypeChange: function(m) {
      this.model.set({ "keySelected": false } , { silence: true });
      this.enabled = this._setKeyColumnEnabled();
      this.render();
    },

    _onColumnSelectedChange: function(m) {
      // Don't render again, because we lose the effect :S
      var enabled = m.get('columnSelected');

      this.$el
        .find('a.switch')
        .removeClass(enabled ? 'disabled' : 'enabled')
        .addClass(enabled ? 'enabled' : 'disabled');
    },

    _setKeyColumnEnabled: function() {
      return (this.model.get("joinType") == "regular" && this.model.get("name") != "the_geom")
          || (this.model.get("joinType") == "spatial" && this.model.get("name") == "the_geom")
          ? true
          : false;
    },

    _onRadioClick: function(e){
      if (e && e.preventDefault)
        this.killEvent(e);

      var $a = this.$el.find("a.radiobutton");

      $a.addClass("selected");

      if (this.model.get("keySelected") || !this.enabled) {return false}

      this.model.set({ "keySelected": true } , { silence: true });
      this.trigger('keyColumn', this.model.get("name"), this.model.get("keySelected"))
    },

    _unselectKey: function() {
      if (this.model.get("keySelected")) {
        this.model.set({ "keySelected": false }, { silent: true });
        this.$el.find('a.radiobutton').removeClass("selected");  
      }
    },

    _onSwitchClick: function(e){
      this.killEvent(e);
      var $a = $(e.target).closest("a")
        , columnSelected = this.model.get("columnSelected");

      if (columnSelected) {
        $a
          .removeClass('enabled')
          .addClass('disabled');
      } else {
        $a
          .removeClass('disabled')
          .addClass('enabled');
      }

      this.model.set("columnSelected",!columnSelected);
      this.trigger('mergeColumns', this.model.get("name"), !columnSelected);
    }
  });





  /**
   *  Table columns preview component
   */
  cdb.admin.TableColumnSelector = cdb.core.View.extend({

    className: 'table_column_selector',

    events: {
      'change div.select.tables': '_selectTable',
      'click div.merge_all a':    '_toggleMergeAllColumns'
    },

    initialize: function() {
      // Bind all
      _.bindAll(this, '_setTables', '_selectTable', '_setColumns', '_setKeyColumn', '_setMergeColumns', '_toggleMergeAllColumns');

      // Bindings

      // Table column template
      this.template = cdb.templates.getTemplate('common/views/table_column_selector');

      // Inits
      this.subColumns   = [];                                           // Columns subviews
      this.keyColumn    = null;                                         // Key column to merge
      this.mergeColumns = [];                                           // Columns to be rendered in the merge
      this.schema       = [];                                           // Table schema
      this.table_name   = this.model && this.model.get('name') || null; // Table name
    },

    render: function() {

      // Render template
      var attributes = _.clone(this.model ? this.model.toJSON() : {});

      attributes.choose_table_text = this.options.choose_table_text;

      // Append table body
      this.$el.append(this.template(attributes));

      // Append columns if there is a model
      if (this.model) {
        this._setColumns({schema: this.model.get('schema')})
      }

      // Render widgets
      this._initWidgets();

      // If there is no table from model
      // load all available tables
      if (!this.model)
        this._getTables();

      return this;
    },

    _addColumns: function(schema) {
      var self = this;

      // Clean previous columns
      this._cleanColumns();

      // Clean new schema (filteredColumns)
      this.schema = _.compact(_.map(schema, function(column, key) {
        if (!_.contains(self.options.filteredColumns, column[0])) {
          return column[0]
        }
      }));

      // Add new subviews and save them 
      _.each(this.schema, function(column, i) {
        self._addColumn(column);
      });
    },

    _addColumn: function(column) {
      var c = new cdb.admin.ColumnSelector({
        model: new cdb.admin.ColumnSelectorModel({
          name:           column,
          joinType:       this.options.joinType,
          keySelected:    false,
          columnSelected: true
        })
      })
        .bind('keyColumn', this._setKeyColumn)
        .bind('mergeColumns', this._setMergeColumns);

      this.$el.find("ul").append(c.render().el);
      
      this.addView(c);
      
      this.subColumns.push(c);
      this.mergeColumns.push(column);
    },

    _cleanColumns: function() {
      var self = this;
      _.each(this.subColumns, function(columnView, i) {
        columnView
          .unbind("keyColumn mergeColumns")
          .clean();
      });

      this.subColumns = [];
      this.mergeColumns = [];
    },

    _initWidgets: function() {
      var extra = [];
      
      if (this.model) {
        extra = [[this.model.get("name"),1]];
      }

      var tables = this.tables = new cdb.forms.Combo({
        el:           this.$el.find('div.select.tables'),
        model:        this.model,
        property:     'name',
        width:        '227px',
        disabled:     true,
        placeholder:  'Select one of your tables',
        extra:        extra
      });

      this.$el.find("div.select.tables").append(tables.render());

      this.addView(this.tables);
    },

    _getTables: function() {
      if (this.options.url) {
        $.ajax({
          url:      this.options.url,
          dataType: 'jsonp',
          success:  this._setTables
        });
      }
    },

    _setTables: function(r) {
      var $select = this.$el.find("select")
        , self = this
        , tables = _.filter(r.tables, function(t){
                return !_.contains(self.options.filteredTables, t.name);
              });

      // Create options
      var options = '<option></option>';
      _.each(tables, function(t){
        options += '<option value="' + t.id + '">' + t.name + '</option>'
      });

      // Apply new select
      $select.select2('destroy');
      $select.html('');
      $select.append(options);
      $select.removeAttr("disabled");

      $select.select2({
        placeholder: this.options.placeholder,
        minimumResultsForSearch: 20
      });
    },

    // After selecting a table
    _selectTable: function(e) {
      // Remove key selected
      this.keyColumn = null;

      // Set new table
      var _id = $(e.target).select2('val');
      this.table_name = $(e.target).find("option[value='" + _id + "']").text();

      // Get columns
      this._getColumns(e.val);
      
      // Animation
      this.$el.find("div.table").addClass("chosen");
      
      // Remove merge_all button
      this._hideMergeAll();
    },

    // Get table schema
    _getColumns: function(table_id) {
      if (this.options.url && table_id) {
        $.ajax({
          url:      this.options.url + "/" + table_id,
          dataType: 'jsonp',
          success:  this._setColumns
        });
      }
    },

    // Add new columns from the table selected
    _setColumns: function(r) {
      this._addColumns(r.schema);
      this._showMergeAll();
      this._selectKeyByDefault();
    },


    // Select by default a value depending on the type of join
    // spatial - the_geom
    // regular - any value, not the_geom
    _selectKeyByDefault: function() {
      if (!this.keyColumn) {
        var firstView;
        if (this.options.joinType == "regular") {
          firstView = _.find(this.subColumns, function(colView){ return colView.model.get('name') != 'the_geom'; });
          firstView.model.set({ 'keySelected': true });
          this.keyColumn = firstView.model.get('name');
        } else {
          firstView = _.find(this.subColumns, function(colView){ return colView.model.get('name') == 'the_geom'; });
          firstView.model.set({ 'keySelected': true });
          this.keyColumn = firstView.model.get('name');
        }
      }

      this.trigger("keyColumnChanged", this);
    },


    // New key column selected
    _setKeyColumn: function(c, value) {
      this.keyColumn = c;

      // Remove selected class
      _.each(this.subColumns, function(columnView) {
        if (columnView.model.get("name") != c) {
          columnView._unselectKey();
        }
      });

      this.trigger("keyColumnChanged", this);
    },

    // New column added/removed for merging
    _setMergeColumns: function(c, value) {
      if (value) {
        this.mergeColumns.push(c);
      } else {
        this.mergeColumns = _.without(this.mergeColumns,c);
      }

      // Check merge_all button
      this._checkAllSelector();
    },

    // If the join type is changed
    setJoinType: function(type) {
      this.options.joinType = type;

      this.keyColumn = null;

      _.each(this.subColumns, function(colView){
        colView.model.set({ 'joinType': type });
      });

      this._selectKeyByDefault();
    },




    // Select or unselect all columns
    _toggleMergeAllColumns: function(e) {
      this.killEvent(e);

      var $sw = $(e.target).closest('a')
        , enabled = (this.mergeColumns.length == this.subColumns.length);
      
      // Change button state
      if (enabled) {
        $sw.removeClass("enabled").addClass("disabled");
      } else {
        $sw.removeClass("disabled").addClass("enabled");
      }

      // Set columns value
      _.each(this.subColumns, function(colView){
        if (colView.model.get('columnSelected') != !enabled)
          colView.model.set({ 'columnSelected': !enabled });
      });

      // Set values
      if (enabled) {
        this.mergeColumns = [];
      } else {
        this.mergeColumns = _.map(this.subColumns, function(colView) { return colView.model.get('name')})
      }
    },

    // Check merge all button if it is enabled or not
    _checkAllSelector: function() {
      var $merge_all = this.$el.find("div.merge_all a");
      if (this.mergeColumns.length == this.subColumns.length) {
        $merge_all
          .removeClass('disabled')
          .addClass('enabled');
      } else {
        $merge_all
          .removeClass('enabled')
          .addClass('disabled');
      }
    },

    // Show merge all button
    _showMergeAll: function() {
      var $mall = this.$el.find('div.merge_all');
      $mall
        .find("a")
        .removeClass("disabled")
        .addClass("enabled");
      $mall.fadeIn('fast');
    },

    // Hide merge all button
    _hideMergeAll: function() {
      this.$el.find('div.merge_all').fadeOut('fast');
    }
  });