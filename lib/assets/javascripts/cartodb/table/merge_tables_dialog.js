/**
* Shows a dialog to start merging two tables
*  new MergeTablesDialog({
*    model: table
*  })
*
*/

cdb.admin.MergeTablesModel = cdb.core.Model.extend({

});


cdb.admin.MergeTablesDialog = cdb.admin.BaseDialog.extend({

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

    _.bindAll(this, "_onKeyUp", "_onChangeState", "_onChangeDescriptionTitle", "_onChangeEnableNext", "_onChangeEnableBack", "_loadState", "_onNextClick", "_onBackClick", "_onRadioClick", "_onToggleMergeFlavorList", "_onToggleTableSelector", "_onTableSelected", "_mergeMethodSelected", "_merge", "_importCopy", "_onMergeSuccess", "_onMergeError");

    _.extend(this.options, {
      template_name:         'table/views/merge_tables_dialog_base',
      title:                 _t("Merge with another table"),
      description:           _t("Table merging is useful if you want to combine data from two tables into a single new table. You can merge tables by a column attribute or as a spatial intersection."),
      width:                 633,
      clean_on_hide:         true,
      cancel_button_classes: "margin15",
      ok_button_classes:     "button disabled grey",
      ok_title:              _t("Next"),
      modal_type:            "creation tables_selector",
      modal_class:           'merge_tables_dialog'
    });

    this.constructor.__super__.initialize.apply(this);

    this.join_type  = "regular";
    this.enabled    = false;
    this.model      = new cdb.admin.MergeTablesModel({});
    this.table      = this.options.table;

    // Default name for the merged table
    this.model.set("merge_name", this.model.get("name") + "_merge");

    this.options.cancel_title = _t("Go back");

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
    this.model.bind("change:state",                  this._onChangeState,            this);
    this.model.bind("change:show_merge_flavor_list", this._onToggleMergeFlavorList,  this);
    this.model.bind("change:show_table_selector",    this._onToggleTableSelector,    this);
    this.model.bind("change:show_table_name_form",   this._onToggleTableNameForm,    this);
    this.model.bind("change:merge_flavor",           this._onChangeMergeFlavor,      this);

  },

  setHeight: function(h, animated) {

    this.model.set("height", h);

    if (animated) {
      this.$el.find(".content").animate({ height: h }, this.options.speed);
    } else {
      this.$el.find(".content").css({ height: h });
    }

    return this;

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
      enableBack:     false
    });

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
    }, 200);

  },

  _loadState: function() {

    var
    mergeFlavor      = this.model.get("merge_flavor"),
    state            = this.model.get("state"),
    previousState    = this.model.get("previous_state"),
    alreadyActivated = this.model.get("already_activated"),//&& mergeFlavor != "spatial"
    enableNext       = false;


    if (!this.model.get("merge_flavor")) return;

    var stepName = "merge_tables_" + mergeFlavor + "_" + state;

    /*console.log("State ", state);
    console.log("Previous State: ", previousState);
    console.log("Already activated", alreadyActivated);
    */

    if ( (previousState < state && previousState > 0) || alreadyActivated ) enableNext = true;

    if (state == 0) {

      this.model.set({
        show_merge_flavor_list: true,
        show_table_selector:    false,
        show_table_name_form:   false,
        enableNext:             true,
        title: _t("Merge with another table"),
        nextButtonText:         _t("Next"),
        description_title: "",
        description: "Table merging is useful if you want to combine data from two tables into a single new table. You can merge tables by a column attribute or as a spatial intersection."
      });

      //this._center();

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
        title:                  _t("Merge with another table"),
        nextButtonText:         "Merge tables",
        description_title:      "Column Join",
        description:            "Create a new table by selecting two tables and the columns containing the shared value. First, select the columns you want to matching between tables and then select and deselect columns you want and don't want in your new table. You can only merge tables by joining by columns of the same type (e.g. number to a number)."
      });

      //this._center();

      this.merge_table._setupTheGeom();
      this.actual_table._setupTheGeom();

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
        title:                  _t("Merge with another table"),
        description_title:      "Spatial Join",
        nextButtonText:         "Merge tables",
        description:            "Calculate the intersecting geospatial records between two tables (ex. points in polygons). You'll need to decide the operation to perform: COUNT calculates the number of intersecting records, SUM sums of a column value for all intersecting records, AVG provides the average value of a column for all intersecting records."
      });

      //this.merge_table.resetMergeMethods();
      //this._center();

      this.merge_table._setupTheGeom();
      this.actual_table._setupTheGeom();

      return;
    }

    if (stepName == "merge_tables_regular_2" || stepName == "merge_tables_spatial_2") {

      this.model.set({
        enableBack:             true,
        enableNext:             enableNext,
        show_merge_flavor_list: false,
        show_table_selector:    false,
        show_table_name_form:   true,
        nextButtonText:         _t("Next"),
        title: _t("Name for your merge table"),
        description_title: "",
        description: ""
      });

      this._focusInput();
      //this._center();

      return;
    }

    if (stepName == "merge_tables_regular_3" || stepName == "merge_tables_spatial_3") {

      var merge_table_name = this.$input.val();
      this.model.set("merge_name", merge_table_name);
      console.log(merge_table_name);

      this.model.set({
        enableBack: true,
        enableNext:             enableNext,
        show_merge_flavor_list: false,
        show_table_selector:    false,
        show_table_name_form:   false,
        title: "",
        description_title: "",
        description: "",
      });

      this._merge();
      this._showLoader();
      this.$el.find(".modal.tables_selector").fadeOut(250);

      return;
    }

  },

  _hideLoader: function() {
    this.$el.find(".modal.merging").fadeOut(250);
  },

  _showLoader: function() {
    this.$el.find(".modal.merging")
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

  _onChangeState: function() {
    //alert('a');
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
    .render();

    this.addView(actual_table);

    // Create merge table component
    var merge_table = this.merge_table = new cdb.admin.TableColumnSelector({
      el: $el.find('.merge_table'),
      url: '/api/v1/tables/',
      choose_table_text: 'Choose a table to merge with ' + this.table.get("name"),
      filteredColumns: this.FILTERED_COLUMNS,
      filteredTables: [this.table.get('name')],
      joinType: 'regular',
      source: 'destiny'
    })
    .render()
    .bind('tableSelected',       this._onTableSelected)
    .bind('mergeMethodSelected', this._mergeMethodSelected);

    this.addView(merge_table);

  },

  _mergeMethodSelected: function(enableNext) {

    this.model.set({
      enableNext: enableNext,
      nextButtonText: "Merge tables",
      already_activated: true
    });

  },

  _onTableSelected: function() {

    if (this.model.get("merge_flavor") != "spatial") {

      this.model.set({
        enableNext: true,
        nextButtonText: "Merge tables",
        already_activated: true
      });

    } else {
      this.model.set({
        enableNext: false
      });
    }

  },

  render_content: function() {

    var $content = $(this.getTemplate('table/views/merge_tables_content')(this.model.toJSON()));

    var $el = $("<div class='inner_content'></div>").append($content);

    this._createTableColumnSelectors($el);

    this.$next             = this.$el.find(".next");
    this.$back             = this.$el.find(".back");

    this.$mergeFlavorList  = $el.find(".join_types");
    this.$tableSelector    = $el.find(".tables");
    this.$tableNameForm    = $el.find(".table_name");

    this.$title            = this.$el.find(".tables_selector h3");
    this.$input            = $el.find("input.name");

    this.$description      = $el.find(".description");
    this.$descriptionTitle = $el.find(".title");

    return $el;
  },


  // Focus over text input
  _focusInput: function() {

    // Hack to prevent animation remove input focus
    var $input = this.$el.find("input.text");

    var name = this.model.get("name") + "_merge";
    $input.val(name);
    this.model.set("merge_name", name);

    setTimeout(function() { $input.focus() });

  },

  // Check merge name
  _checkMergeName: function(table_name, merge_table_name) {
    return (merge_table_name.length > 0 && table_name != merge_table_name) ? true : false;
  },

  // On key down
  _onKeyUp: function(ev) {

    var merge_table_name = $(ev.target).val();

    if (this._checkMergeName(this.actual_table.model.get("name"), merge_table_name)) {

      this._toggleInputError(false);
      this.model.set("merge_name", merge_table_name);
      this.model.set("enableNext", true);

    } else {

      this._toggleInputError(true);
      this.model.set("enableNext", false);

    }

  },

  // Show or hide input error
  _toggleInputError: function(active) {
    if (active) {
      this.$el.find("div.info").addClass("active");
    } else {
      this.$el.find("div.info").removeClass("active");
    }
  },

  _generateRegularQuery: function() {

    var self  = this;
    var sql   = "SELECT ";

    _.each(this.actual_table.mergeColumns, function(col){ // Add actual table columns
      sql += self.actual_table.table_name + "." + col + ", ";
    });

    _.each(this.merge_table.mergeColumns, function(col){ // Add merge table columns

      sql += self.merge_table.table_name + "." + col;

      if (_.contains(self.actual_table.mergeColumns, col)) { // If the column is already present in the actual_table
        sql += " AS " + self.merge_table.table_name + "_" + col;
      }

      sql += ", ";

    });

    // Remove last space + comma
    sql = sql.slice(0, sql.length - 2);

    // LEFT JOIN
    sql += " FROM " + this.actual_table.table_name + " FULL OUTER JOIN " + this.merge_table.table_name + " ON ";

    // JOIN FIELD
    sql += this.actual_table.table_name + "." + this.actual_table.keyColumn + " = " + this.merge_table.table_name + "." + this.merge_table.keyColumn;

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

    sql += origin_name + ".cartodb_id, " + origin_name + ".the_geom_webmercator, ";

    _.each(this.actual_table.mergeColumns, function(col){ // Add actual table columns
      sql += self.actual_table.table_name + "." + col + ", ";
    });

    sql += "(SELECT COUNT(*) FROM " + destiny_name + " WHERE ST_Intersects(" + origin_name + ".the_geom, " + destiny_name + ".the_geom)) AS intersect_count FROM " + origin_name;

    //console.log(sql);

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

    sql += origin_name + ".cartodb_id, " + origin_name + ".the_geom_webmercator, ";

    _.each(this.actual_table.mergeColumns, function(col){ // Add actual table columns
      sql += self.actual_table.table_name + "." + col + ", ";
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

    sql += origin_name + ".cartodb_id, " + origin_name + ".the_geom_webmercator, ";

    _.each(this.actual_table.mergeColumns, function(col){ // Add actual table columns
      sql += self.actual_table.table_name + "." + col + ", ";
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

    console.log("Merging: ", this.model.get("merge_name"), sql);

    var data = { table_name: this.model.get("merge_name"), sql: sql };

    $.ajax({
      type: "POST",
      url: "/api/v1/imports",
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
      this._showError('99999','Unknown', 'Sorry, something went wrong and we\'re not sure what. Contact us at <a href="mailto:contac@cartodb.com">contact@cartodb.com</a>.');
    }
  },

  // Starts duplication copy
  _importCopy: function(item_queue_id) {

    var self = this;

    var imp = this.importation = new cdb.admin.Import({ item_queue_id: item_queue_id });

    // Bind complete event
    imp.bind("importComplete", function(e) {
      imp.unbind();
      window.location.href = "/tables/" + imp.get("table_id") + "/";
    }, this);

    // Bind error event
    imp.bind("importError", function(e) {
      self._showError(e.attributes.error_code, e.attributes.get_error_text.title, e.attributes.get_error_text.what_about);
    }, this);

    imp.pollCheck();
  },

  //Show the error when duplication fails
  _showError: function(number, description, wadus) {

    this._hideLoader();

    // Add data
    var template = cdb.templates.getTemplate("dashboard/views/error_dialog_content")
    , opts = {number: number, description: description, about:wadus};

    this.$el.find("div.error_content").html(template(opts));

    this.$el.find(".modal.error")
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
    var $modal = this.$el.find('.modal.tables_selector')
    , modal_height = $modal.height()

    if (modal_height > 0) {
      $modal.animate({
        marginTop: -(modal_height/2)
      }, (animation) ? 220 : 0)
    }
  }

});
