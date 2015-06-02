/**
* Shows a dialog to start merging two tables
*  new MergeTablesDialog({
*    model: table
*  })
*
*/

cdb.admin.MergeTablesModel = cdb.core.Model.extend({

  defaults: {
    regularMerge: true,
    spatialMerge: true,
    nextButtonText: _("Next")
  }

});

cdb.admin.MergeTablesDialog = cdb.admin.BaseDialog.extend({

  _TEXTS: {
    title:      _t("Merge with another dataset"),
    desc:       _t("Dataset merging is useful if you want to combine data from two datasets into a single \
                new dataset. You can merge datasets by a column attribute or as a spatial intersection."),
    next:       _t("Next"),
    back:       _t("Go back"),
    merge: {
      column: {
        title:  _t("Column Join"),
        desc:   _t("Create a new dataset by selecting two datasets and the columns containing the shared value. \
                First, select the matching column in both datasets and then select or deselect \
                the columns you want in your new dataset. You can only merge datasets by joining by \
                columns of the same type (e.g. number to a number)."),
      },
      spatial: {
        title:  _t("Spatial join"),
        desc:   _t("Calculate the intersecting geospatial records between two datasets (ex. points in polygons). \
                You'll need to decide the operation to perform: COUNT calculates the number of intersecting records, \
                SUM sums of a column value for all intersecting records, AVG provides the average value of a column \
                for all intersecting records.")
      },
      name:     _t("Name for your merge dataset"),
      choose:   _t('Choose a dataset to merge with {{ table_name }}'),
      next:     _t('Merge datasets')
    },
    errors: {
      sorry:    _t('Sorry, something went wrong and we\'re not sure what. Contact us at \
                  <a href="mailto:support@cartodb.com">support@cartodb.com</a>.')
    }
  },

  FILTERED_COLUMNS: [
    'cartodb_id',
    'created_at',
    'updated_at',
    'the_geom_webmercator',
    'cartodb_georef_status'
  ],

  events: function(){
    return _.extend({},cdb.admin.BaseDialog.prototype.events,{
      "keyup input.text":           "_onKeyUp",
      "click ul.join_types li a":   "_onRadioClick",
      "click .next":                "_onNextClick",
      "click .back":                "_onBackClick"
    });
  },

  initialize: function() {

    _.bindAll(this, "_onKeyUp", "_onChangeDescriptionTitle", "_onChangeEnableNext", "_onChangeEnableBack", "_loadState", "_onNextClick", "_onBackClick", "_onRadioClick", "_onToggleMergeFlavorList", "_onToggleTableSelector", "_onTableSelected", "_mergeMethodSelected", "_merge", "_importCopy", "_onMergeSuccess", "_onMergeError");

    _.extend(this.options, {
      template_name:         'table/header/views/merge_tables_dialog_base',
      title:                 this._TEXTS.title,
      description:           this._TEXTS.desc,
      width:                 633,
      clean_on_hide:         true,
      cancel_button_classes: "margin15",
      ok_button_classes:     "button disabled grey",
      ok_title:              this._TEXTS.next,
      modal_type:            "creation tables_selector",
      modal_class:           'merge_tables_dialog'
    });

    this.constructor.__super__.initialize.apply(this);

    this.join_type  = "regular";
    this.enabled    = false;
    this.model      = new cdb.admin.MergeTablesModel({});
    this.table      = this.options.table;

    // Default name for the merged table
    this.model.set("merge_name", this.table.get("name") + "_merge");

    this.options.cancel_title = this._TEXTS.back;

    // Default values
    this.model.set({
      title:                 this.options.title,
      description:           this.options.description,
      nextButtonText:        this.options.ok_title, show_merge_flavor_list: true,
      show_table_selector:   false,
      show_table_name_form:  false,
      enableNext:            false,
      enableBack:            false,
      state:                 0
    });

    // Model binding
    this.model.bind("change:title",                  this._onChangeTitle,            this);
    this.model.bind("change:description",            this._onChangeDescription,      this);
    this.model.bind("change:description_title",      this._onChangeDescriptionTitle, this);
    this.model.bind("change:nextButtonText",         this._onChangeNextButtonText,   this);
    this.model.bind("change:enableNext",             this._onChangeEnableNext,       this);
    this.model.bind("change:enableBack",             this._onChangeEnableBack,       this);
    this.model.bind("change:show_merge_flavor_list", this._onToggleMergeFlavorList,  this);
    this.model.bind("change:show_table_selector",    this._onToggleTableSelector,    this);
    this.model.bind("change:show_table_name_form",   this._onToggleTableNameForm,    this);
    this.model.bind("change:merge_flavor",           this._onChangeMergeFlavor,      this);

  },

  _canApplyRegularMerge: function() {

    var self   = this;
    var schema = this.table.get("schema");

    var columns = _.compact(_.map(schema, function(column, key) {
      if (!_.contains(self.FILTERED_COLUMNS, column[0])) {
        return { name: column[0], columnType: column[1] }
      }
    }));

    var columnNames = _.find(columns, function(colView){
      return colView.name != 'the_geom';
    });

    if (columnNames) return true;
    else return false;

  },

  /*
   *  Called when the user clicks in the $next button
   */
  _onNextClick: function(e) {

    this.killEvent(e);

    if (!this.model.get("enableNext")) return;

    this.model.set({
      previous_state: this.model.get("state"),
      state: this.model.get("state") + 1,
      enableNext: false
    });

    this._loadState();

  },

  /*
   *  Called when the user clicks in the $back button
   */
  _onBackClick: function(e) {

    this.killEvent(e);

    if (!this.model.get("enableBack")) return;

    this.model.set({
      previous_state: this.model.get("state"),
      state:          this.model.get("state") - 1,
      nextButtonText: this._TEXTS.merge.next,
      enableBack:     false
    });

    var
    mergeFlavor      = this.model.get("merge_flavor"),
    state            = this.model.get("state");

    var stepName = "merge_tables_" + mergeFlavor + "_" + state;

    if (state == 0) {
    this.merge_table._hideCountCover();

    }

    this._loadState();

  },

  _onChangeNextButtonText: function() {
    var self = this;

    this.$next.fadeOut(250, function() {
      self.$next.text(self.model.get("nextButtonText"));
      self.$next.fadeIn(250);
    });

  },

  _onChangeTitle: function() {

    var self = this;

    var $title = this.$title;

    $title.fadeOut(250, function() {
      $title.text(self.model.get("title"));
      $title.fadeIn(250);
    });

  },

  _onChangeDescription: function() {

    var self = this;
    var $description = this.$description;

    $description.fadeOut(250, function() {
      $description.text(self.model.get("description"));
      $description.fadeIn(250);
    });

  },

  _onChangeDescriptionTitle: function() {

    var self = this;
    var $title = this.$descriptionTitle;

    $title.fadeOut(250, function() {
      $title.text(self.model.get("description_title"));
      $title.fadeIn(250);
    });

  },

  _onChangeEnableNext: function() {

    if (this.model.get("enableNext")) {
      this.$next.removeClass("disabled");
    } else {
      this.$next.addClass("disabled");
    }

  },

  _onChangeEnableBack: function() {

    if (this.model.get("enableBack")) {

      this.$back.fadeIn(250, function() {
        $(this).removeClass("hidden");
      });

    } else {

      this.$back.fadeOut(250, function() {
        $(this).addClass("hidden");
      });

    }

  },

  _center: function() {
    var self = this;

    setTimeout(function() {
      self.centerInScreen(true);
    }, 100);

  },

  _loadState: function() {

    var
    mergeFlavor      = this.model.get("merge_flavor"),
    state            = this.model.get("state"),
    previousState    = this.model.get("previous_state"),
    alreadyActivated = this.model.get("already_activated"),//&& mergeFlavor != "spatial"
    enableNext       = false;

    if(state == 1) {
      cdb.god.trigger('mixpanel', "Use visual merge",
        {
          flavor: mergeFlavor,
          table: this.table.get("name")
        });
    }

    if (!this.model.get("merge_flavor")) return;

    var stepName = "merge_tables_" + mergeFlavor + "_" + state;

    if ( (previousState < state && previousState > 0) || alreadyActivated ) enableNext = true;

    if (state == 0) {

      this.model.set({
        show_merge_flavor_list: true,
        show_table_selector:    false,
        show_table_name_form:   false,
        enableNext:             true,
        title:                  this._TEXTS.title,
        nextButtonText:         this.model.get("nextButtonText") || this.model.defaults.nextButtonText,
        description_title:      "",
        description:            this._TEXTS.desc
      });


      this.merge_table.resetMergeMethods();

      return;
    }

    if (stepName == "merge_tables_regular_1") {

      var self = this;

      this.model.set({
        enableBack:             true,
        enableNext:             enableNext,
        show_merge_flavor_list: false,
        show_table_selector:    true,
        show_table_name_form:   false,
        title:                  this._TEXTS.title,
        description_title:      this._TEXTS.merge.column.title,
        nextButtonText:         this._TEXTS.merge.next,
        description:            this._TEXTS.merge.column.desc
      });

      this.merge_table._setupRegularMerge();
      this.actual_table._setupRegularMerge();

      return;
    }

    // SPATIAL STEP #1
    if (stepName == "merge_tables_spatial_1") {

      var self = this;

      this.model.set({
        enableBack:             true,
        enableNext:             enableNext,
        show_merge_flavor_list: false,
        show_table_selector:    true,
        show_table_name_form:   false,
        title:                  this._TEXTS.title,
        description_title:      this._TEXTS.merge.spatial.title,
        nextButtonText:         this._TEXTS.merge.next,
        description:            this._TEXTS.merge.spatial.desc
      });

      this.merge_table._setupSpatialMerge();
      this.actual_table._setupSpatialMerge();

      return;
    }

    if (stepName == "merge_tables_regular_2" || stepName == "merge_tables_spatial_2") {

      this.model.set({
        enableBack:             true,
        enableNext:             enableNext,
        show_merge_flavor_list: false,
        show_table_selector:    false,
        show_table_name_form:   true,
        nextButtonText:         this._TEXTS.next,
        title:                  this._TEXTS.merge.name,
        description_title:      "",
        description:            ""
      });

      this._focusInput();

      return;
    }

    if (stepName == "merge_tables_regular_3" || stepName == "merge_tables_spatial_3") {

      var merge_table_name = this.$input.val();
      this.model.set("merge_name", merge_table_name);

      this.model.set({
        enableBack: true,
        enableNext:             enableNext,
        show_merge_flavor_list: false,
        show_table_selector:    false,
        show_table_name_form:   false,
        title:                  "",
        description_title:      "",
        description:            ""
      });

      this._merge();
      this._showLoader();
      this.$(".modal.tables_selector").fadeOut(250);

      return;
    }

  },

  _hideLoader: function() {
    this.$(".modal.merging").fadeOut(250);
  },

  _showLoader: function() {
    this.$(".modal.merging")
    .css({
      opacity:0,
      display:"block",
      marginTop: "0px"
    })
    .animate({
      opacity: 1,
      marginTop: -200
    }, 600);
  },

  _onChangeMergeFlavor: function() {
    var mergeFlavor = this.model.get("merge_flavor");

    this.actual_table.setJoinType(mergeFlavor);
    this.merge_table.setJoinType(mergeFlavor);
  },

  _onRadioClick: function(e) {

    this.killEvent(e);

    var $selectedRadioButton  = $(e.target).closest("a");
    var mergeFlavor = $selectedRadioButton.attr("data-merge-flavor");

    if (mergeFlavor == 'regular' && !this.model.get("regularMerge")) return;

    this.$mergeFlavorList.find(".radiobutton").removeClass("selected");
    $selectedRadioButton.addClass("selected");

    // Enable the next button
    this.model.set({
      enableNext: true,
      merge_flavor: mergeFlavor
    });

  },

  _onToggleMergeFlavorList: function() {

    if (this.model.get("show_merge_flavor_list")) {
      this.$mergeFlavorList.delay(170).slideDown(150);
    } else {
      this.$mergeFlavorList.delay(170).slideUp(150);
    }

  },

  _onToggleTableSelector: function() {
    var self = this;

    if (this.model.get("show_table_selector")) {
      this.$tableSelector.delay(100).slideDown(150, function() {
        self._center();
      });
    } else {
      this.$tableSelector.delay(100).slideUp(150, function() {
        self._center();
      });
    }

  },
  _onToggleTableNameForm: function() {

    if (this.model.get("show_table_name_form")) {
      this.$tableNameForm.delay(200).slideDown(120);
    } else {
      this.$tableNameForm.delay(200).slideUp(120);
    }

  },

  _createTableColumnSelectors: function($el) {

    // Create actual table column preview
    var actual_table = this.actual_table = new cdb.admin.TableColumnSelector({
      el: $el.find('.actual_table'),
      model: this.table,
      choose_table_text: '',
      filteredColumns: this.FILTERED_COLUMNS,
      joinType: 'regular',
      source: 'origin'
    })
    .bind("columnChanged", this._onColumnChanged, this)
    .render();

    this.addView(actual_table);

    // Create merge table component
    var merge_table = this.merge_table = new cdb.admin.TableColumnSelector({
      el: $el.find('.merge_table'),
      url: cdb.config.prefixUrl() + '/api/v1/tables/',
      choose_table_text: this._TEXTS.merge.choose.replace("{{ table_name }}", this.table.get("name")),
      filteredColumns: this.FILTERED_COLUMNS,
      filteredTables: [this.table.get('name')],
      joinType: 'regular',
      source: 'destiny'
    })
    .render()
    .bind("columnChanged",       this._onColumnChanged, this)
    .bind('tableSelected',       this._onTableSelected)
    .bind('mergeMethodSelected', this._mergeMethodSelected);

    this.addView(merge_table);

  },

  _onColumnChanged: function(data) {

    if (this.actual_table.options.joinType != 'regular') return;
    if (data.name != 'the_geom') return;

    var theGeomValue;

    // Switch the value of the_geom between the two tables
    if (this.merge_table && data.source === 'origin') {

      var the_geom = this.merge_table._getTheGeom();

      if (the_geom) {
        theGeomValue = the_geom.model.get("switchSelected");

        this.actual_table._getTheGeom().setSilent(theGeomValue);
        this.merge_table._getTheGeom().setSilent(!theGeomValue);
      }


    } else if (this.merge_table) {

      theGeomValue = this.actual_table._getTheGeom().model.get("switchSelected");

      this.actual_table._getTheGeom().setSilent(!theGeomValue);
      this.merge_table._getTheGeom().setSilent(theGeomValue);

    }

  },

  _mergeMethodSelected: function(enableNext) {

    this.model.set({
      enableNext: enableNext,
      nextButtonText: this._TEXTS.merge.next,
      already_activated: true
    });

  },

  _onTableSelected: function() {

    var self = this;

    if (this.model.get("merge_flavor") != "spatial") {

      this.model.set({
        enableNext: true,
        nextButtonText: this._TEXTS.merge.next,
        already_activated: true
      });

    } else {

      this.model.set({
        enableNext: false
      });

    }

  },

  render_content: function() {

    if (!this._canApplyRegularMerge()) {
      this.model.set("regularMerge", false);
    }

    var $content = $(this.getTemplate('table/header/views/merge_tables_content')(this.model.toJSON()));

    var $el = $("<div class='inner_content'></div>").append($content);

    this._createTableColumnSelectors($el);

    this.$next             = this.$(".next");
    this.$back             = this.$(".back");

    this.$mergeFlavorList  = $el.find(".join_types");
    this.$tableSelector    = $el.find(".tables");
    this.$tableNameForm    = $el.find(".table_name");

    this.$title            = this.$(".tables_selector h3");
    this.$input            = $el.find("input.name");

    this.$description      = $el.find(".description");
    this.$descriptionTitle = $el.find(".title");

    return $el;
  },


  // Focus over text input
  _focusInput: function() {

    // Hack to prevent animation remove input focus
    var $input = this.$("input.text");

    var name = this.table.get("name") + "_merge";
    $input.val(name);
    this.model.set("merge_name", name);

    setTimeout(function() { $input.focus() });

  },

  // Check merge name
  _checkMergeName: function(table_name, merge_table_name) {
    return (merge_table_name.length > 0 && table_name != merge_table_name) ? true : false;
  },

  // On key up
  _onKeyUp: function(ev) {

    var error = false;
    var merge_table_name = $(ev.target).val();

    if (this._checkMergeName(this.actual_table.model.get("name"), merge_table_name)) {

      this._toggleInputError(false);
      this.model.set("merge_name", merge_table_name);
      this.model.set("enableNext", true);
      error = false;

    } else {

      this._toggleInputError(true);
      this.model.set("enableNext", false);
      error = true;

    }

    // If the user press enter and there was no error, merge
    if (ev.keyCode == 13 && !error) {

      this.model.set({
        previous_state: this.model.get("state"),
        state: this.model.get("state") + 1,
        enableNext: false
      });

      this._loadState();

    }

  },

  // Show or hide input error
  _toggleInputError: function(active) {
    if (active) {
      this.$("div.info").addClass("active");
    } else {
      this.$("div.info").removeClass("active");
    }
  },

  _generateRegularQuery: function() {

    var self  = this,
        sql   = "SELECT ",
        actualTableType = "",
        mergeTableType = "",
        actualTableGeomName = null,
        mergeTableGeomName = null;

    if (this.actual_table._getTheGeom().model.get("switchSelected")) {
      actualTableGeomName = this.actual_table._getTheGeom().model.get("name");
    }

    if (this.merge_table._getTheGeom().model.get("switchSelected")) {
      mergeTableGeomName = this.merge_table._getTheGeom().model.get("name");
    }

    _.each(this.actual_table.mergeColumns, function(col){ // Add actual table columns
      if (actualTableGeomName !== null && col === actualTableGeomName) {
        sql += "CASE WHEN " + self.actual_table.table_name + "." + col + " IS NULL THEN " + self.merge_table.table_name
            + "." + col + " ELSE " + self.actual_table.table_name + "." + col + " END AS " + col + ", ";
      } else {
        sql += self.actual_table.table_name + "." + col + ", ";
      }
    });

    _.each(this.merge_table.mergeColumns, function(col){ // Add merge table columns
      if (mergeTableGeomName !== null && col === mergeTableGeomName) {
        sql += "CASE WHEN " + self.merge_table.table_name + "." + col + " IS NULL THEN " + self.actual_table.table_name
          + "." + col + " ELSE " + self.merge_table.table_name + "." + col + " END AS " + col;
      } else {
        sql += self.merge_table.table_name + "." + col;
      }

      if (_.contains(self.actual_table.mergeColumns, col)) { // If the column is already present in the actual_table
        sql += " AS " + self.merge_table.table_name + "_" + col;
      }
      sql += ", ";
    });

    // Remove last space + comma
    sql = sql.slice(0, sql.length - 2);

    // LEFT JOIN
    sql += " FROM " + this.actual_table.table_name + " FULL OUTER JOIN " + this.merge_table.table_name + " ON ";

    // Get the origin column type
    _.each(this.actual_table.model.get("schema"), function(column) {
      if (column[0] == self.actual_table.keyColumn) actualTableType = column[1];
    });

    // Get the destiny column type
    _.each(this.merge_table.schema, function(column) {
      if (column.name == self.merge_table.keyColumn) mergeTableType = column.columnType;
    });

    // JOIN FIELD
    if (actualTableType == "string" && mergeTableType == "string") {
      sql += "LOWER(TRIM(" + this.actual_table.table_name + "." + this.actual_table.keyColumn + ")) = LOWER(TRIM(" + this.merge_table.table_name + "." + this.merge_table.keyColumn + "))";
    } else {
      sql += this.actual_table.table_name + "." + this.actual_table.keyColumn + " = " + this.merge_table.table_name + "." + this.merge_table.keyColumn;
    }

    return sql;

  },

  /*
   * SPATIAL QUERY SELECTOR
   */
  _generateSpatialQuery: function() {

    var mergeMethod = this.merge_table.mergeMethod;

    if (mergeMethod == 'count') return this._generateCOUNTSpatialQuery();
    if (mergeMethod == 'avg')   return this._generateAVGSpatialQuery();
    if (mergeMethod == 'sum')   return this._generateSUMSpatialQuery();

    return false;

  },

  /*
   * SPATIAL COUNT QUERY
   */
  _generateCOUNTSpatialQuery: function() {

    var self  = this;
    var sql   = "SELECT ";

    var origin_name  = this.actual_table.model.get("name");
    var destiny_name = this.merge_table.table_name;

    sql += origin_name + ".cartodb_id, " + origin_name + ".the_geom_webmercator, " + origin_name + ".the_geom, ";

    _.each(this.actual_table.mergeColumns, function(col){ // Add actual table columns
      if (col != "the_geom") {
        sql += self.actual_table.table_name + "." + col + ", ";
      }
    });

    sql += "(SELECT COUNT(*) FROM " + destiny_name + " WHERE ST_Intersects(" + origin_name + ".the_geom, " + destiny_name + ".the_geom)) AS intersect_count FROM " + origin_name;

    return sql;

  },

  /*
   * SPATIAL AVG QUERY
   */
  _generateAVGSpatialQuery: function() {

    var self  = this;
    var sql   = "SELECT ";

    var origin_name  = this.actual_table.model.get("name");
    var destiny_name = this.merge_table.table_name;

    sql += origin_name + ".cartodb_id, " + origin_name + ".the_geom_webmercator, " + origin_name + ".the_geom, ";

    _.each(this.actual_table.mergeColumns, function(col){ // Add actual table columns
      if (col != "the_geom") {
        sql += self.actual_table.table_name + "." + col + ", ";
      }
    });

    sql += "(SELECT AVG(" + destiny_name + "." + this.merge_table.keyColumn + ") FROM " + destiny_name + " WHERE ST_Intersects(" + origin_name + ".the_geom, " + destiny_name + ".the_geom)) AS intersect_avg FROM " + origin_name;

    return sql;

  },

  /*
   * SPATIAL SUM QUERY
   */
  _generateSUMSpatialQuery: function() {

    var self  = this;
    var sql   = "SELECT ";

    var origin_name  = this.actual_table.model.get("name");
    var destiny_name = this.merge_table.table_name;

    sql += origin_name + ".cartodb_id, " + origin_name + ".the_geom_webmercator, " + origin_name + ".the_geom, ";

    _.each(this.actual_table.mergeColumns, function(col){ // Add actual table columns
      if (col != "the_geom") {
        sql += self.actual_table.table_name + "." + col + ", ";
      }
    });

    sql += "(SELECT SUM(" + destiny_name + "." + this.merge_table.keyColumn + ") FROM " + destiny_name + " WHERE ST_Intersects(" + origin_name + ".the_geom, " + destiny_name + ".the_geom)) AS intersect_sum FROM " + origin_name;

    return sql;

  },

  // Generate the necessary SQL
  _generateQuery: function() {

    if (this.model.get("merge_flavor") == "regular") return this._generateRegularQuery();
    if (this.model.get("merge_flavor") == "spatial") return this._generateSpatialQuery();

    return false;

  },

  // Start duplication of the table
  _merge: function() {

    var sql = this._generateQuery();

    var data = { table_name: this.model.get("merge_name"), sql: sql };

    $.ajax({
      type: "POST",
      url: cdb.config.prefixUrl() + "/api/v1/imports",
      data: data,
      success: this._onMergeSuccess,
      error:   this._onMergeError
    });

  },

  _onMergeSuccess: function(r) {
    this._importCopy(r.item_queue_id);
  },

  _onMergeError: function(e) {

    try {
      this._showError(e.attributes.error_code,e.attributes.get_error_text.title,e.attributes.get_error_text.what_about);
    } catch(e) {
      this._showError('99999','Unknown', this._TEXTS.error.default);
    }
  },

  // Starts duplication copy
  _importCopy: function(item_queue_id) {

    var self = this;

    var imp = this.importation = new cdb.admin.Import({ item_queue_id: item_queue_id });

    // Bind complete event
    imp.bind("importComplete", function(e) {
      imp.unbind();
      window.location.href = cdb.config.prefixUrl() + "/tables/" + (imp.get("table_name") || imp.get("table_id")) + "/";
    }, this);

    // Bind error event
    imp.bind("importError", function(e) {
      self._showError(e.attributes.error_code, e.attributes.get_error_text.title, e.attributes.get_error_text.what_about);
    }, this);

    this.add_related_model(imp);

    imp.pollCheck();
  },

  //Show the error when duplication fails
  _showError: function(number, description, wadus) {

    this._hideLoader();

    // Add data
    var template = cdb.templates.getTemplate("old_common/views/error_dialog_content")
    , opts = {number: number, description: description, about:wadus};

    this.$("div.error_content").html(template(opts));

    this.$(".modal.error")
    .css({
      opacity:0,
      display:"block",
      marginTop: "0px"
    })
    .animate({
      opacity: 1,
      marginTop: -200
    }, 600);

  },

  _ok: function(ev) { },

  /*
   * Centers the .modal dialog in the middle of the screen.
   *
   * You can pass { animation: true } to center the current dialog in the screen
   * with animation or not
   */
  centerInScreen: function(animation) {
    var $modal = this.$('.modal.tables_selector')
    , modal_height = $modal.height()

    if (modal_height > 0) {
      $modal.animate({
        marginTop: -(modal_height/2)
      }, (animation) ? 220 : 0)
    }
  }
});

