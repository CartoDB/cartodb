/**
*  Model for Column Selector
*/
cdb.admin.ColumnSelectorModel = cdb.core.Model.extend({
  defaults: {
    selected:   false,
    showRadio:  true,
    showSwitch: true,
    visible:    true,
    enabled:    true,
    columnType: ""
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
    _.bindAll(this, '_onSwitchSelected');

    this.model.bind("change:joinType",        this._onJoinTypeChange,        this);

    // Selections
    this.model.bind("change:selected",        this._onRadioSelected,         this);
    this.model.bind("change:switchSelected",  this._onSwitchSelected,        this);

    this.model.bind("change:enableRadio",     this._onToggleRadio,           this);

    this.model.bind("change:enabled",         this._onToggle,                this);

    // Visibility events
    this.model.bind("change:visible",         this._onToggleVisiblity,       this);
    this.model.bind("change:showRadio",       this._onToggleRadioVisiblity,  this);
    this.model.bind("change:showSwitch",      this._onToggleSwitchVisiblity, this);

    // Flag to know if column could be key or not
    this._setKeyColumnEnabled();

  },

  _onToggle: function() {

    if (this.model.get("enabled")) {
      this.$el.find(".radiobutton").removeClass('disabled');
    } else {
      this.$el.find(".radiobutton").addClass('disabled');
    }

  },

  _onToggleRadio: function() {

    if (this.model.get("enableRadio")) {
      this.$el.find(".radiobutton").removeClass('disabled');
    } else {
      this.$el.find(".radiobutton").addClass('disabled');
    }

  },

  _onToggleVisiblity: function() {

    if (this.model.get("visible")) {
      this.$el.slideDown(250);
    } else {
      this.$el.slideUp(250);
    }

  },

  _onToggleRadioVisiblity: function() {

    if (this.model.get("showRadio")) {

      this.$el.find(".radiobutton .radio").animate({ opacity: 1 }, { duration: 150, complete: function() {
        $(this).parent().removeClass('hidden_radio');
      }});

    } else {

      this.$el.find(".radiobutton .radio").animate({ opacity: 0 }, { duration: 150, complete: function() {
        $(this).parent().addClass('hidden_radio');
      }});

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
    var $content = $(cdb.templates.getTemplate('old_common/views/column_selector')(this.model.toJSON()));
    this.$el.append($content);

    return this;
  },

  _onJoinTypeChange: function(m) {

    this.model.set({ "selected": false } , { silent: true });

    this._setKeyColumnEnabled();

    this.render();

  },

  _setKeyColumnEnabled: function() {

    var
    showRadio   = true,
    showSwitch  = true,
    enabled     = false,
    name        = this.model.get("name"),
    mergeFlavor = this.model.get("joinType"),
    source      = this.model.get("source");

    if (mergeFlavor == "regular" && name != "the_geom")  enabled = true;

    if (mergeFlavor == "spatial") {
      if (name != "the_geom")  enabled    = true;
      if (source == 'origin')  showRadio  = false;
      if (source == 'destiny') showSwitch = false;
    }

    this.model.set({ enabled: enabled, showSwitch: showSwitch, showRadio: showRadio });

  },

  _unselectKey: function() {

    if (this.model.get("selected")) {
      this.model.set({ "selected": false }, { silent: true });
      this.$el.find('a.radiobutton').removeClass("selected");
    }

  },

  /*
  * Throw an event when the user clicks in the radio button
  */
  _onRadioClick: function(e){

    this.killEvent(e);

    if (!this.model.get('enabled'))   return false;
    if (!this.model.get('showRadio')) return false;

    this.model.set("selected", true);

    this.trigger('keyColumn', this.model.get("name"), true);

  },

  _onRadioSelected: function() {

    var selected = this.model.get('selected');
    var $radio = this.$el.find('a.radiobutton');

    if (selected) {

      $radio.addClass("selected");

      //if (!this.model.get("enabled")) return false;

      this.trigger('keyColumn', this.model.get("name"), true);
    }

  },

  // Sets the switch value silently (but updates the UI)
  setSilent: function(enabled) {

    this.model.set({ switchSelected: enabled }, { silent: true });

    this.$el
    .find('a.switch')
    .removeClass(enabled ? 'disabled' : 'enabled')
    .addClass(enabled ? 'enabled' : 'disabled');

    this.trigger('addColumn', this.model.get("name"), enabled);

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

    this.killEvent(e);

    this.model.set("switchSelected", !this.model.get("switchSelected"));

  }

});


/**
*  Table columns preview component
*/
cdb.admin.TableColumnSelector = cdb.core.View.extend({

  className: 'table_column_selector',

  events: {
    'change div.select.tables':      '_selectTable',
    'click div.merge_all a':         '_toggleMergeAllColumns',
    'click div.merge_methods li a':  'onClickMergeMethod'
  },

  initialize: function() {
    // Bind all
    _.bindAll(this, '_setTables', '_selectTable', '_setColumns', '_setKeyColumn', '_setMergeColumns', '_setSilentMergeColumns', '_toggleMergeAllColumns', 'onClickMergeMethod', "_setupSpatialColumns");

    // Table column template
    this.template = cdb.templates.getTemplate('old_common/views/table_column_selector');

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
    attributes.source            = this.options.source;

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
        return { name: column[0], columnType: column[1] }
      }
    }));

    // Add new subviews and save them
    _.each(this.schema, function(column, i) {
      self._addColumn(column.name, column.columnType);
    });
  },

  // Add column
  _addColumn: function(name, columnType) {

    var
    showRadio = true,
    enabled   = true;

    if (this.mergeMethod == 'count' && this.options.source == 'destiny' && this.options.joinType == 'spatial') showRadio = false;
    if (this.mergeMethod != 'count' && this.options.source == 'destiny' && this.options.joinType == 'spatial' && columnType != 'number') enabled = false;
    if (this.options.joinType == 'spatial' && this.options.source == 'origin') showRadio = false;

    var switchSelected = (name == 'the_geom' && this.options.source == 'destiny') ? false : true;

    var model = new cdb.admin.ColumnSelectorModel({
      selected:       false,
      switchSelected: switchSelected,
      name:           name,
      columnType:     columnType,
      joinType:       this.options.joinType,
      enabled:        enabled,
      showRadio:      showRadio,
      source:         this.options.source
    });

    var c = new cdb.admin.ColumnSelector({
      model: model
    })
    .bind('keyColumn',    this._setKeyColumn)
    .bind('mergeColumns', this._setMergeColumns)
    .bind('addColumn',    this._setSilentMergeColumns);

    this.$el.find(".columns > ul").append(c.render().el);

    this.addView(c);

    this.subColumns.push(c);

    if (name == 'the_geom' && this.options.source == 'destiny') { }
    else { this.mergeColumns.push(name); }

  },

  // Clean previous columns
  _cleanColumns: function() {

    var self = this;

    _.each(this.subColumns, function(columnView, i) {
      columnView
      .unbind("keyColumn mergeColumns")
      .clean();
    });

    this.subColumns   = [];
    this.mergeColumns = [];
  },

  // Init widgets
  _initWidgets: function() {

    var placeholder = "";

    if (this.model) placeholder = this.model.get("name");

    var tables = this.tables = new cdb.forms.Combo({
      el:           this.$el.find('div.select.tables'),
      model:        this.model,
      property:     'name',
      width:        '227px',
      disabled:     true,
      placeholder:  placeholder
    });

    this.$el.find("div.select.tables").append(tables.render());

    this.addView(this.tables);
  },

  // Get all user tables
  _getTables: function() {
    var tables = new cdb.admin.Visualizations();
    tables.options.set({ type: 'table', per_page: 100000, table_data: false });
    var order = { data: { o: { updated_at: "desc" }, exclude_raster: true }};
    tables.bind('reset', this._setTables, this);
    tables.fetch(order);
  },

  // Create tables selector
  _setTables: function(r) {
    var $select = this.$el.find("select")
    , self = this
    , tables = r.filter(function(t){
      return !_.contains(self.options.filteredTables, t.get("name"));
    });

    // Create options
    var options = '<option></option>';
    _.each(tables, function(t){

      var table = t.get("table");

      if (table) {
        options += '<option value="' + table.id + '">' + t.get("name") + '</option>'
      }

    });

    // Apply new select
    $select.select2('destroy');
    $select.html('');
    $select.append(options);
    $select.removeAttr("disabled");

    $select.select2({
      placeholder:  'Select one of your datasets',
      minimumResultsForSearch: 20
    });
  },

  _selectOption: function(id) {
    // Remove key selected
    this.keyColumn = null;

    // Set new table
    this.table_name = this.$el.find("option[value='" + id + "']").text();

    // Get columns
    this._getColumns(id);

    // Animation
    this.$el.find("div.table").addClass("chosen");

    // Remove merge_all button
    this._hideMergeAll();
  },

  // After selecting a table
  _selectTable: function(e) {
    e && this._selectOption($(e.target).select2('val'));
    this.tableSelected = true;
    this.trigger("tableSelected", this);
    this.setMergeMethod(this.mergeMethod);
  },

  // Get table schema
  _getColumns: function(table_id) {

    if (this.options.url && table_id) {
      $.ajax({
        url:      this.options.url + table_id,
        dataType: 'jsonp',
        success:  this._setColumns
      });
    }

  },

  // Add new columns from the table selected
  _setColumns: function(r) {
    this._addColumns(r.schema);
    this._selectKeyByDefault();
    this._updateFooter();
    this._setupTheGeom();
  },

  _showTheGeom: function() {

    var the_geom  = this._getTheGeom();
    if (the_geom) {
    the_geom.model.set({ visible: true });
    the_geom.$el.show();
    }

  },

  _hideTheGeom: function() {

    var the_geom  = this._getTheGeom();
    if (the_geom) {
      the_geom.model.set({ visible: false });
      the_geom.$el.hide();
    }

  },

  _setupTheGeom: function() {

    if      (this.options.joinType == "regular") this._showTheGeom();
    else if (this.options.joinType == "spatial") this._hideTheGeom();

  },

  _setupRegularMerge: function() {

    this._setupTheGeom();

  },

  _setupSpatialMerge: function() {

    this._setupTheGeom();
    this._hideCountCover();

    if (this.options.joinType == "spatial") {

      if (this.tableSelected) this.setMergeMethod();
      this._toggleNextButton();

    }

  },

  _selectRegularKey: function() {

    var the_geom  = this._getTheGeom();
    var firstView = this._getKeyColumn();

    if (firstView) {
      firstView.model.set({ selected: true });
      this.keyColumn = firstView.model.get('name');
    }

  },

  _selectSpatialKey: function() {

    var the_geom  = this._getTheGeom();

    if (this.options.source == 'destiny') {

      var firstView = this._getKeyColumn();

      if (firstView) {
        firstView.model.set({ selected: true });
        this.keyColumn = firstView.model.get('name');
      }

    }

  },

  // Select by default a value depending on the type of join
  // spatial - the_geom
  // regular - any value, not the_geom
_selectKeyByDefault: function() {

  if (this.subColumns.length > 0) {

    if      (this.options.joinType == "regular") this._selectRegularKey();
    else if (this.options.joinType == "spatial") this._selectSpatialKey();

    this.trigger("keyColumnChanged", this);

  }

},

_getNumber: function() {

  return _.find(this.subColumns, function(colView){ return colView.model.get('columnType') == 'number'; });

},

_getTheGeom: function() {

  return _.find(this.subColumns, function(colView){ return colView.model.get('name') == 'the_geom'; });

},

// Get first column that is not the_geom
_getKeyColumn: function() {

  return _.find(this.subColumns, function(colView){ return colView.model.get('enabled') && colView.model.get('name') != 'the_geom'; });

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

// Silently adds/removes merge columns
_setSilentMergeColumns: function(c, value) {

  if (value) {
    this.mergeColumns.push(c);
  } else {
    this.mergeColumns = _.without(this.mergeColumns,c);
  }

  this.mergeColumns = _.uniq(this.mergeColumns);

  // Check merge_all button
  this._checkAllSelector();

},

// Adds/removes merge columns
_setMergeColumns: function(c, value) {

  if (value) {
    this.mergeColumns.push(c);
  } else {
    this.mergeColumns = _.without(this.mergeColumns,c);
  }

  // Check merge_all button
  this._checkAllSelector();

  this.trigger("columnChanged", { source: this.options.source, name: c, value: value }, this);

},

// If the join type is changed
setJoinType: function(type) {

  this.options.joinType = type;

  if (type == 'regular') this.mergeMethod = null;

  this.keyColumn = null;

  var self = this;

  _.each(this.subColumns, function(colView){
    colView.model.set({ switchSelected: colView.model.attributes.name == 'the_geom' && self.options.source == 'destiny' ? false : true, joinType: type });
  });

  this._selectKeyByDefault();

  this._updateFooter();

},

_updateFooter: function() {


  if (!this.table_name) return;

  this._hideMergeMethods();
  this._hideMergeAll();

  if (this.options.joinType == 'regular') {

    this._showMergeAll();

  } else {

    if (this.options.source == 'origin') {
      this._showMergeAll();
    } else {
      this._showMergeMethods();
    }

  }

},

_setupSpatialColumns: function() {

  if (this.options.joinType != 'spatial') return;

  if (this.mergeMethod == 'count') {

    this._showCountCover();

  } else if (this.mergeMethod == 'sum' || this.mergeMethod == 'avg') {

    this._hideCountCover();

    _.each(this.subColumns, function(column) {

      if (column.model.get("columnType") != "number") column.model.set({ enabled: false, showRadio: true });
      else column.model.set({ enabled: true, showRadio: true });

    });

  }

},

_hideCountCover: function() {
  this.$el.find(".cover").fadeOut(200);
},

_showCountCover: function() {
  this.$el.find(".cover").fadeIn(200);
},

resetMergeMethods: function() {
  this.$el.find(".merge_methods li a").removeClass("selected");
},

setMergeMethod: function(name) {

  if (!name) name = 'count';

  this.mergeMethod = name;

  this._setupSpatialColumns();
  this._selectKeyByDefault();

  this.$el.find(".merge_methods li a." + name).addClass("selected");

  this._toggleNextButton();

},

onClickMergeMethod: function(e) {

  this.killEvent(e);

  this.resetMergeMethods();
  this.mergeMethod = $(e.target).text().toLowerCase();

  this._setupSpatialColumns();
  this._selectKeyByDefault();

  $(e.target).addClass("selected");

  this._toggleNextButton();

},

/*
 * Enables/Disables next button depending on the merge method selected and the colum types
 * */
_toggleNextButton: function() {

  var
  enableNext  = true,
  numberColum =  this._getNumber();

  // There has to be a number column if we want to apply AVG or SUM
  if (numberColum == undefined && this.mergeMethod != "count") enableNext = false;

  this.trigger("mergeMethodSelected", enableNext);

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

    if (colView.model.get('switchSelected') != !enabled) {
      colView.model.set({ 'switchSelected': !enabled });
    }

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

_enableTipsy: function() {

  var self = this;

  if (!this.options.tipsy_enabled) {

    // Tipsy tooltip ready!
    $(".merge_methods a")
    .tipsy({
      gravity: 's',
      html: true,
      live: true,
      fade: true,
      title: function() {
        return $(this).attr("data-tipsy")
      }
    });

  } else {
    this.options.tipsy_enabled = true;
  }

},

// Show merge methods
_showMergeMethods: function() {
  var $mall = this.$el.find('div.merge_methods');

  $mall
  .find("a")
  .removeClass("disabled")
  .removeClass("hidden")
  .addClass("enabled");

  this._enableTipsy();
  // Move to left if there is scroll in columns list
  //if (this.mergeColumns.length > 5) {
  //$mall.addClass('moveRight');
  //}

  $mall.show();

  this.setMergeMethod(this.mergeMethod);
},

// Hide merge all button
_hideMergeMethods: function() {
  this.$el.find('.merge_methods').addClass("hidden").hide();
},

// Show merge all button
_showMergeAll: function() {
  var $mall = this.$el.find('.merge_all');
  $mall
  //.removeClass("moveRight")
  .find("a")
  .removeClass("disabled")
  .addClass("enabled");

  // Move to left if there is scroll in columns list
  //if (this.mergeColumns.length > 5) {
  //$mall.addClass('moveRight');
  //}

  $mall.show();
},

// Hide merge all button
_hideMergeAll: function() {
  this.$el.find('div.merge_all').hide();
}
});

