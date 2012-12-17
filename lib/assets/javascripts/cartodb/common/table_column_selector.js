  /**
   *  Column selector
   */
  cdb.admin.ColumnSelector = cdb.core.View.extend({

    tagName: 'li',

    events: {
      'click a.radiobutton':  '_selectKey',
      'click a.switch':       '_selectColumn'
    },

    initialize: function() {
      this.keySelected = false;
      this.columnSelected = true;
    },

    render: function() {
      var $content = $(cdb.templates.getTemplate('common/views/column_selector')({ name: this.options.name }));
      this.$el.append($content)
      return this;
    },

    _selectKey: function(e){
      this.killEvent(e);
      var $a = $(e.target).closest("a");

      if (this.keySelected) {return false}

      this.keySelected = true;

      $a.addClass("selected");

      this.trigger('keyColumn', this.options.name, this.keySelected)
    },

    _unselectKey: function() {
      if (this.keySelected) {
        this.keySelected = false;
        this.$el.find('a.radiobutton').removeClass("selected");  
      }
    },

    _disableKey: function(e) {

    },

    _selectColumn: function(e){
      this.killEvent(e);
      var $a = $(e.target).closest("a");

      if (this.columnSelected) {
        $a
          .removeClass('enabled')
          .addClass('disabled');
      } else {
        $a
          .removeClass('disabled')
          .addClass('enabled');
      }

      this.columnSelected = !this.columnSelected;
      
      this.trigger('mergeColumns', this.options.name, this.columnSelected)
    }
  });





  /**
   *  Table columns preview component
   */
  cdb.admin.TableColumnSelector = cdb.core.View.extend({

    className: 'table_column_selector',

    events: {
      'change div.select.tables': '_selectTable'
    },

    initialize: function() {
      // Bind all
      _.bindAll(this, '_setTables', '_selectTable', '_setColumns', '_setKeyColumn', '_setMergeColumns');

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
        this._addColumns(this.model.get('schema'));
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
      var c = new cdb.admin.ColumnSelector({ name: column })
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
      var $select = this.$el.find("select");

      // Create options
      var options = '';
      _.each(r.tables, function(t){
        options += '<option value="' + t.id + '">' + t.name + '</option>'
      });

      $select.select2('destroy');
      $select.append(options);
      $select.removeAttr("disabled");

      $select.select2({
        placeholder: this.options.placeholder
      });
    },

    _selectTable: function(e) {
      // Set new table
      var _id = $(e.target).select2('val');
      this.table_name = $(e.target).find("option[value='" + _id + "']").text();
      // Get columns
      this._getColumns(e.val);
      // Animation
      this.$el.find("div.table").addClass("chosen");
    },

    _getColumns: function(table_id) {
      if (this.options.url && table_id) {
        $.ajax({
          url:      this.options.url + "/" + table_id,
          dataType: 'jsonp',
          success:  this._setColumns
        });
      }
    },

    _setColumns: function(r) {
      this._addColumns(r.schema);
    },

    _setKeyColumn: function(c, value) {
      this.keyColumn = c;

      // Remove selected class
      _.each(this.subColumns, function(columnView) {
        if (columnView.options.name != c) {
          columnView._unselectKey();
        }
      });
    },

    _setMergeColumns: function(c, value) {
      if (value) {
        this.mergeColumns.push(c);
      } else {
        this.mergeColumns = _.without(this.mergeColumns,c);
      }

    }

  });