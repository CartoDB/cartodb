var _ = require('underscore');
var $ = require('jquery');
var cdb = require('cartodb.js');
var BaseDialog = require('../../views/base_dialog/view.js');
var MergeDatasetsModel = require('./merge_datasets_model.js');
var ViewFactory = require('../../view_factory.js');
var randomQuote = require('../../view_helpers/random_quote.js');
var ErrorDetailsView = require('../../views/error_details_view');

/**
* Shows a dialog to start merging two tables
*  new MergeDatasetsDialog({
*    model: table
*  })
* Migrated from old code.
*/
module.exports = BaseDialog.extend({

  _TEXTS: {
    next:       _t("Next"),
    merge: {
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
    return _.extend({}, BaseDialog.prototype.events, {
      "keyup input.text":           "_onKeyUp",
      'click .js-merge-flavor:not(.is-disabled)': '_onClickMergeFlavor',
      "click .next":                "_onNextClick",
      "click .js-back":             "_onBackClick"
    });
  },

  initialize: function() {
    _.bindAll(this, "_onKeyUp", "_onChangeEnableNext", "_loadState", "_onNextClick", "_onBackClick", "_onClickMergeFlavor", "_onToggleMergeFlavorList", "_onToggleTableSelector", "_onTableSelected", "_mergeMethodSelected", "_merge", "_importCopy", "_onMergeSuccess", "_onMergeError");

    this.options.clean_on_hide = true;
    this.constructor.__super__.initialize.apply(this);

    this.join_type  = "regular";
    this.enabled    = false;
    this.model      = new MergeDatasetsModel({});
    this.table      = this.options.table;
    this.user       = this.options.user;

    // Default name for the merged table
    this.model.set("merge_name", this.table.get("name") + "_merge");

    // Default values
    this.model.set({
      nextButtonText:        this.options.ok_title,
      show_merge_flavor_list: true,
      show_table_selector:   false,
      show_table_name_form:  false,
      enableNext:            false,
      state:                 0
    });

    // Model binding
    this.model.bind("change:nextButtonText",         this._onChangeNextButtonText,   this);
    this.model.bind("change:enableNext",             this._onChangeEnableNext,       this);
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
    this._gotoNextState();
  },

  // Extracted from onNextClick since might be triggered from other callbacks (e.g. onClickMergeFlavor),
  // which don't go through the "next" button.
  _gotoNextState: function() {
    if (!this.model.get("enableNext")) return;

    this.model.set({
      previous_state: this.model.get("state"),
      state: this.model.get("state") + 1,
      enableNext: false
    });

    this._loadState();
  },

  _onBackClick: function(e) {
    this.killEvent(e);

    this.model.set({
      previous_state: this.model.get("state"),
      state:          this.model.get("state") - 1,
      nextButtonText: this._TEXTS.merge.next
    });

    var
    mergeFlavor      = this.model.get("merge_flavor"),
    state            = this.model.get("state");

    if (state == 0) {
    this.merge_table._hideCountCover();

    }

    this._loadState();
  },

  _onChangeNextButtonText: function() {
    var self = this;
    this._$next().fadeOut(250, function() {
      self._$next().text(self.model.get("nextButtonText"));
      self._$next().fadeIn(250);
    });
  },

  _onChangeEnableNext: function() {
    if (this.model.get("enableNext")) {
      this._$next().removeClass("disabled");
    } else {
      this._$next().addClass("disabled");
    }
  },

  _loadState: function() {
    var
    mergeFlavor      = this.model.get("merge_flavor"),
    state            = this.model.get("state"),
    previousState    = this.model.get("previous_state"),
    alreadyActivated = this.model.get("already_activated"),//&& mergeFlavor != "spatial"
    enableNext       = false;

    if (state == 1) {
      cdb.god.trigger('mixpanel', "Use visual merge",
        {
          flavor: mergeFlavor,
          table: this.table.get("name")
        });
    }

    if (!this.model.get("merge_flavor")) return;

    var stepName = mergeFlavor + "_" + state;
    if ( (previousState < state && previousState > 0) || alreadyActivated ) enableNext = true;

    if (state == 0) {
      this.model.set({
        show_merge_flavor_list: true,
        show_table_selector:    false,
        show_table_name_form:   false,
        enableNext:             true,
        nextButtonText:         this.model.get("nextButtonText") || this.model.defaults.nextButtonText
      });

      this.merge_table.resetMergeMethods();

      return;
    }

    if (stepName == "regular_1") {
      this.model.set({
        enableNext:             enableNext,
        show_merge_flavor_list: false,
        show_table_selector:    true,
        show_table_name_form:   false,
        nextButtonText:         this._TEXTS.merge.next
      });

      this.merge_table._setupRegularMerge();
      this.actual_table._setupRegularMerge();

      return;
    }

    if (stepName == "spatial_1") {
      this.model.set({
        enableNext:             enableNext,
        show_merge_flavor_list: false,
        show_table_selector:    true,
        show_table_name_form:   false,
        nextButtonText:         this._TEXTS.merge.next
      });

      this.merge_table._setupSpatialMerge();
      this.actual_table._setupSpatialMerge();

      return;
    }

    if (stepName == "regular_2" || stepName == "spatial_2") {
      this.model.set({
        enableNext:             enableNext,
        show_merge_flavor_list: false,
        show_table_selector:    false,
        show_table_name_form:   true,
        nextButtonText:         this._TEXTS.next
      });

      this._focusInput();

      return;
    }

    if (stepName == "regular_3" || stepName == "spatial_3") {
      var merge_table_name = this._$input().val();
      this.model.set("merge_name", merge_table_name);

      this.model.set({
        enableNext:             enableNext,
        show_merge_flavor_list: false,
        show_table_selector:    false,
        show_table_name_form:   false,
      });

      this._merge();
      this._showLoader();
      this.$(".tables_selector").fadeOut(250);

      return;
    }
  },

  _showLoader: function() {
    this._loadingView = ViewFactory.createDialogByTemplate('common/templates/loading', {
      title: 'Merging datasets and generating the new one…',
      quote: randomQuote()
    });
    this.addView(this._loadingView);
    this._loadingView.appendToBody();
  },

  _onChangeMergeFlavor: function() {
    var mergeFlavor = this.model.get("merge_flavor");

    this.actual_table.setJoinType(mergeFlavor);
    this.merge_table.setJoinType(mergeFlavor);
  },

  _onClickMergeFlavor: function(e) {
    this.killEvent(e);

    var mergeFlavor = $(e.currentTarget).closest('.js-merge-flavor').data('merge-flavor');
    if (mergeFlavor === 'regular' && !this.model.get('canApplyRegularMerge')) return;

    this.model.set({
      enableNext: true,
      merge_flavor: mergeFlavor
    });

    this._gotoNextState();
  },

  _onToggleMergeFlavorList: function() {
    if (this.model.get("show_merge_flavor_list")) {
      this._$mergeFlavorList().show();
    } else {
      this._$mergeFlavorList().hide();
    }
  },

  _onToggleTableSelector: function() {
    if (this.model.get("show_table_selector")) {
      this._$tableSelector().show();
    } else {
      this._$tableSelector().hide();
    }
  },
  _onToggleTableNameForm: function() {
    if (this.model.get("show_table_name_form")) {
      this._$tableNameForm().delay(200).slideDown(120);
    } else {
      this._$tableNameForm().delay(200).slideUp(120);
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
      this.model.set('canApplyRegularMerge', false);
    }
    var $el = $(this.getTemplate('common/dialogs/merge_datasets/merge_datasets_content')(this.model.toJSON()));
    this._createTableColumnSelectors($el);

    return $el;
  },

  _$next: function() {
    return this.$('.next');
  },

  _$mergeFlavorList: function() {
    return this.$('.js-merge-flavors-list');
  },

  _$tableSelector: function() {
    return this.$('.js-table-selector');
  },

  _$tableNameForm: function() {
    return this.$('.table_name');
  },

  _$input: function() {
    return this.$('input.name');
  },

  _$inputText: function() {
    return this.$("input.text");
  },

  // Focus over text input
  _focusInput: function() {
    // Hack to prevent animation remove input focus
    var name = this.table.get("name") + "_merge";
    this._$inputText().val(name);
    this.model.set("merge_name", name);

    var self = this;
    setTimeout(function() {
      self._$inputText().focus();
    });
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
    this.hide(); // effectivately removes loading dialog too since added a subview

    // Add data
    var dialog = ViewFactory.createDialogByView(
      new ErrorDetailsView({
        err: {
          error_code: number,
          title: description,
          what_about: wadus
        },
        user: this.user
      })
    );
    dialog.appendToBody();
  },

  _ok: function(ev) { }
});
