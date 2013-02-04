  /**
   *  Model for Column Selector
   */
  cdb.admin.ColumnSelectorModel = cdb.core.Model.extend({
    defaults: {
      showRadio: true,
      showSwitch: true
    }

  });

  /**
   *  Column Selector
   *  - Where a column is rendered applying the correct model in the
   *    · radiobutton
   *    · switch
   */
  cdb.admin.ColumnSelector = cdb.core.View.extend({

    tagName: 'li',

    events: {
      'click a.radiobutton':  '_onRadioClick',
      'click a.switch':       '_onSwitchClick'
    },

    initialize: function() {
      _.bindAll(this, '_onJoinTypeChange', '_onSwitchSelected');

      this.model.bind("change:joinType",        this._onJoinTypeChange);

      // Selections
      this.model.bind("change:keySelected",     this._onRadioSelected,         this);
      this.model.bind("change:switchSelected",  this._onSwitchSelected,        this);

      this.model.bind("change:enableRadio",     this._onToggleRadio,           this);

      // Visibility events
      this.model.bind("change:showRadio",       this._onToggleRadioVisiblity,  this);
      this.model.bind("change:showSwitch",      this._onToggleSwitchVisiblity, this);

      // Flag to know if column could be key or not
      this._setKeyColumnEnabled();

    },

    _onToggleRadio: function() {

      if (this.model.get("enableRadio")) {
        this.$el.find(".radiobutton").removeClass('disabled');
      } else {
        this.$el.find(".radiobutton").addClass('disabled');
      }

    },

    _onToggleRadioVisiblity: function() {

      if (this.model.get("showRadio")) {

        this.$el.find(".radiobutton .radio").fadeIn(250, function() {
          $(this).removeClass('hidden');
        });

      } else {

        this.$el.find(".radiobutton .radio").fadeOut(250, function() {
          $(this).addClass('hidden');
        });

      }

    },

    _onToggleSwitchVisiblity: function() {

      if (this.model.get("showSwitch")) {

        this.$el.find(".switch").fadeIn(250, function() {
          $(this).removeClass('hidden');
        });

      } else {

        this.$el.find(".switch").fadeOut(250, function() {
          $(this).addClass('hidden');
        });

      }

    },

    render: function() {
      this.$el.html('');
      var $content = $(cdb.templates.getTemplate('common/views/column_selector')(this.model.toJSON()));
      this.$el.append($content);
      return this;
    },

    _onJoinTypeChange: function(m) {
      this.model.set({ "keySelected": false } , { silent: true });
      this._setKeyColumnEnabled();

      this.render();
    },

    _setKeyColumnEnabled: function() {

      var
      enabled     = false,
      name        = this.model.get("name"),
      mergeFlavor = this.model.get("joinType");

      if (mergeFlavor == "regular" && name != "the_geom") enabled = true;
      if (mergeFlavor == "spatial" && name == "the_geom") enabled = true;

      this.model.set("enabled", enabled);

    },

    _unselectKey: function() {

      if (this.model.get("keySelected")) {
        this.model.set({ "keySelected": false }, { silent: true });
        this.$el.find('a.radiobutton').removeClass("selected");
      }

    },

    /*
     * Throw an event when the user clicks in the radio button
     */
    _onRadioClick: function(e){

      e && this.killEvent(e);

      this.model.set("keySelected", true);

      if (!this.model.get('enabled')) return false;
      this.trigger('keyColumn', this.model.get("name"), true);

    },

    _onRadioSelected: function() {

      var selected = this.model.get('keySelected');
      var $radio = this.$el.find('a.radiobutton');

      if (selected) {

        $radio.addClass("selected");

        if (!this.model.get("enabled")) return false;

        this.trigger('keyColumn', this.model.get("name"), true);
      }

    },

    /*
     * Throw an event when the user clicks in the switch button
     */
    _onSwitchSelected: function() {

      var enabled = this.model.get('switchSelected');

      this.$el
        .find('a.switch')
        .removeClass(enabled ? 'disabled' : 'enabled')
        .addClass(enabled ? 'enabled' : 'disabled');

      this.trigger('mergeColumns', this.model.get("name"), enabled);

    },

    _onSwitchClick: function(e){

      e && this.killEvent(e);

      this.model.set("switchSelected", !this.model.get("switchSelected"));

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

    // Add all table columns
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

    // Add column
    _addColumn: function(column) {
      var c = new cdb.admin.ColumnSelector({
        model: new cdb.admin.ColumnSelectorModel({
          name:           column,
          joinType:       this.options.joinType,
          keySelected:    false,
          switchSelected: true
        })
      })
      .bind('keyColumn',    this._setKeyColumn)
      .bind('mergeColumns', this._setMergeColumns);

      this.$el.find("ul").append(c.render().el);

      this.addView(c);

      this.subColumns.push(c);
      this.mergeColumns.push(column);
    },

    // Clean previous columns
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

    // Init widgets
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

    // Get all user tables
    _getTables: function() {
      if (this.options.url) {
        $.ajax({
          url:      this.options.url,
          dataType: 'jsonp',
          success:  this._setTables
        });
      }
    },

    // Create tables selector
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
      this._selectKeyByDefault();
      this._showMergeAll();
    },


    // Select by default a value depending on the type of join
    // spatial - the_geom
    // regular - any value, not the_geom
    _selectKeyByDefault: function() {
      if (!this.keyColumn && this.subColumns.length > 0) {
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
        if (colView.model.get('switchSelected') != !enabled)
          colView.model.set({ 'switchSelected': !enabled });
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
        .removeClass("moveRight")
        .find("a")
        .removeClass("disabled")
        .addClass("enabled");

      // Move to left if there is scroll in columns list
      if (this.mergeColumns.length > 5) {
        $mall.addClass('moveRight');
      }

      $mall.fadeIn('fast');
    },

    // Hide merge all button
    _hideMergeAll: function() {
      this.$el.find('div.merge_all').fadeOut('fast');
    }
  });
