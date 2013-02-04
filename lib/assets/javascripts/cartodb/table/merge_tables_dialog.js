/**
* Shows a dialog to start merging two tables
*  new MergeTablesDialog({
*    model: table
*  })
*
*/

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
      "keydown input":              "_onKeyDown",
      "click ul.join_types li a":   "_onRadioClick",
      "click .next":                "_onNextClick",
      "click .back":                "_onBackClick"
    });
  },

  initialize: function() {

    _.bindAll(this, "_onKeyDown", "_checkKeyColumns", "_onChangeState", "_onChangeDescription", "_onChangeDescriptionTitle", "_onChangeEnableNext", "_onChangeEnableBack", "_loadState", "_onNextClick", "_onBackClick", "_onRadioClick", "_onToggleMergeFlavorList", "_onToggleTableSelector");

    _.extend(this.options, {
      template_name:         'table/views/merge_tables_dialog_base',
      title:                 _t("Merge with another table"),
      description:           _t("Merges are really usefull when you want to get data from two tables together in a single one. <strong>Select your join strategy to perform a merge</strong>."),
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
    this.table_name = this.model.get("name") + "_merge";
    this.options.cancel_title = _t("Go back");

    this.table = this.options.model;

    // Default values
    this.model.set("description",            this.options.description);
    this.model.set("nextButtonText",         this.options.ok_title);
    this.model.set("show_merge_flavor_list", true);
    this.model.set("show_table_selector",    false);

    this.model.set("enableNext",             false);
    this.model.set("enableBack",             false);
    this.model.set("state",                  0);

    // Model binding
    this.model.bind("change:description",            this._onChangeDescription, this);
    this.model.bind("change:description_title",      this._onChangeDescriptionTitle, this);
    this.model.bind("change:nextButtonText",         this._onChangeNextButtonText, this);
    this.model.bind("change:enableNext",             this._onChangeEnableNext, this);
    this.model.bind("change:enableBack",             this._onChangeEnableBack, this);
    this.model.bind("change:state",                  this._onChangeState, this);
    this.model.bind("change:show_merge_flavor_list", this._onToggleMergeFlavorList, this);
    this.model.bind("change:show_table_selector",    this._onToggleTableSelector, this);

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
  _onNextClick: function() {
    if (!this.model.get("enableNext")) return;

    this.model.set("state", this.model.get("state") + 1);
    this.model.set("enableNext", false);

    this._loadState();

  },

  /*
   *  Called when the user clicks in the $back button
   */
  _onBackClick: function() {
    if (!this.model.get("enableBack")) return;

    this.model.set("state", this.model.get("state") - 1);
    this.model.set("enableBack", false);

    this._loadState();

  },

  _onChangeNextButtonText: function() {
    this.$next.text(this.model.get("nextButtonText"));
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

  _loadState: function() {

    var
    mergeFlavor = this.model.get("merge_flavor"),
    state       = this.model.get("state");

    if (!this.model.get("merge_flavor")) return;

    var stepName = "merge_tables_" + mergeFlavor + "_" + state;

    if (state == 0) {

      this.model.set("show_merge_flavor_list", true);
      this.model.set("show_table_selector", false);
      this.model.set("enableNext", true);

      this.model.set("description_title", "");
      this.model.set("description", "Merges are really usefull when you want to get data from two tables together in a single one. Select your join strategy to perform a merge.");

      return;
    }

    if (stepName == "merge_tables_regular_1") {

      this.model.set("enableBack", true);

      this.model.set("show_merge_flavor_list", false);
      this.model.set("show_table_selector", true);

      this.model.set("description_title", "Regular Join");
      this.model.set("description", "This let use join two tables by a common column and get a new table as a result. Select a the key column using the radiobuttons and the columns you want to preserve in your new resulting table.");

      return;
    }

    if (stepName == "merge_tables_spatial_1") {

      this.model.set("enableBack", true);

      this.model.set("show_merge_flavor_list", false);
      this.model.set("show_table_selector", true);

      this.model.set("description_title", "Spatial Join");
      this.model.set("description", "Choose a spatial method and the column to use in case you need it. Count will count the number of features intersecting. SUM and AVG will accumulate the value in a numeric column of all the intersecting features and we need more text here.");

      return;
    }

  },

  _onRadioClick: function(e) {

    this.killEvent(e);

    var $selectedRadioButton  = $(e.target).closest("a");
    var mergeFlavor = $selectedRadioButton.attr("data-merge-flavor");

    this.$mergeFlavorList.find(".radiobutton").removeClass("selected");
    $selectedRadioButton.addClass("selected");

    // Enable the next button
    this.model.set("enableNext", true);
    this.model.set("merge_flavor", mergeFlavor);

    // Set the merge flavor
    this.actual_table.setJoinType(mergeFlavor);
    this.merge_table.setJoinType(mergeFlavor);

  },

  _onToggleMergeFlavorList: function() {

    if (this.model.get("show_merge_flavor_list")) {
      this.$mergeFlavorList.slideDown(250);
    } else {
      this.$mergeFlavorList.slideUp(250);
    }

  },

  _onToggleTableSelector: function() {

    if (this.model.get("show_table_selector")) {
      this.$tableSelector.slideDown(250);
    } else {
      this.$tableSelector.slideUp(250);
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
      filteredColumns: this.FILTERED_COLUMNS
      //joinType: 'regular'
    })
    .render()
    .bind('keyColumnChanged', this._checkKeyColumns);

    this.addView(actual_table);

    // Create merge table component
    var merge_table = this.merge_table = new cdb.admin.TableColumnSelector({
      el: $el.find('.merge_table'),
      url: '/api/v1/tables/',
      choose_table_text: 'Choose a table to merge with ' + this.table.get("name"),
      filteredColumns: this.FILTERED_COLUMNS,
      filteredTables: [this.table.get('name')]
      //joinType: 'regular'
    })
    .render()
    .bind('keyColumnChanged', this._checkKeyColumns);

    this.addView(merge_table);

  },

  render_content: function() {

    var $content = $(this.getTemplate('table/views/merge_tables_content')(this.model.toJSON()));

    var $el = $("<div class='inner_content'></div>").append($content);

    this._createTableColumnSelectors($el);

    this.$next             = this.$el.find(".next");
    this.$back             = this.$el.find(".back");

    this.$mergeFlavorList  = $el.find(".join_types");
    this.$tableSelector    = $el.find(".tables");
    this.$description      = $el.find(".description");
    this.$descriptionTitle = $el.find(".title");

    return $el;
  },

  /**
  * STATE 1 - Selecting tables > columns
  */


  // Check if there are two key columns
  // if not, disable next step
  _checkKeyColumns: function() {
    //var $ok_button = this.$el.find("section:eq(0) a.ok");

    /*if (this.merge_table.keyColumn && this.actual_table.keyColumn) {
      this.enabled = true;
      $ok_button.removeClass('disabled');
      // this._checkAffectedRows();
    } else {
      this.enabled = false;
      $ok_button.addClass('disabled');
    }*/
  },


  // Select a join type
  _selectJoinType: function(e) {
    this.killEvent(e);
    var $a  = $(e.target).closest("a")
    , $li = $a.closest("li")
    , $ul = $li.closest("ul");

    // Animate first change
    this._animateFirst();

    // Change selected
    $ul.find("a")
    .removeClass("selected")
    .addClass("inactive");

    $a.addClass("selected")
    .removeClass("inactive");

    // If already selected -> go
    if ($li.attr("class") == this.join_type) return false;

    // Set new join
    this.join_type = $li.attr("class");

    // Change table selectors
    this.actual_table.setJoinType(this.join_type);
    this.merge_table.setJoinType(this.join_type);
  },


  // Animate fist interaction, clicking first time
  _animateFirst: function() {
    var $selector = this.$el.find("section:eq(0) div.selector");
    if (!$selector.find('div.tables').is("visible")) {

      $selector.find("ul.join_types").animate({marginTop:0},250);
      $selector.parent()
      .animate({
        height: 380
      },250)
      .find('div.tables')
      .animate({
        opacity:1
      },250);

      $selector.find("p.intro")
      .animate({
        height:0,
        opacity:0
      },250);
    }
  },


  /**
  * STATE 2 - Choosing new table name
  */

  // Focus over text input
  _focusInput: function() {
    // Hack to prevent animation remove input focus
    var self = this
    , $input = self.$el.find("section.naming input.text");

    $input.val(this.model.get("name") + "_merge");

    setTimeout(function() {
      $input.focus()
    });
  },

  // Check merge name
  _checkMergeName: function(table_name, merge_table_name) {
    if (merge_table_name.length > 0 && table_name != merge_table_name) {
      return true
    } else {
      return false
    }
  },

  // On key down
  _onKeyDown: function(ev) {
    var merge_table_name = $(ev.target).val();

    if (ev.keyCode === 13) {
      if (this._checkMergeName(this.model.get("name"),merge_table_name)) {
        this._toggleInputError(false);
        this.table_name = merge_table_name;
        this._ok();
      } else {
        this._toggleInputError(true);
      }

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




  /**
  *  STATE 3 - Merging
  */

  // Generate the necessary SQL
  _generateSQL: function() {
    var sql   = "SELECT "
    , self  = this;

    // Add actual table columns
    _.each(this.actual_table.mergeColumns, function(col){
      sql += self.actual_table.table_name + "." + col + ",";
    });

    // Add merge table columns
    _.each(this.merge_table.mergeColumns, function(col){
      sql += self.merge_table.table_name + "." + col + " ";
      // If the column is already present in the actual_table
      if (_.contains(self.actual_table.mergeColumns, col)) {
        sql += " AS " + self.merge_table.table_name + "_" + col;
      }
      sql += ",";
    });

    // Remove last comma
    sql = sql.slice(0,sql.length-1);

    // LEFT JOIN
    sql += " FROM " + this.actual_table.table_name + " FULL OUTER JOIN " + this.merge_table.table_name + " ON ";

    // JOIN FIELD
    sql += this.actual_table.table_name + "." + this.actual_table.keyColumn + "=" + this.merge_table.table_name + "." + this.merge_table.keyColumn;

    return sql;
  },


  // Start duplication of the table
  _startMerging: function() {
    var self = this
    , data = {
      table_name: this.table_name,
      sql: this._generateSQL()
    }

    $.ajax({
      type: "POST",
      url: "/api/v1/imports",
      data: data,
      success: function(r) {
        self._importCopy(r.item_queue_id)
      },
      error: function(e) {
        try {
          self._showError(e.attributes.error_code,e.attributes.get_error_text.title,e.attributes.get_error_text.what_about);
        } catch(e) {
          self._showError('99999','Unknown', 'Sorry, something went wrong and we\'re not sure what. Contact us at <a href="mailto:contac@cartodb.com">contact@cartodb.com</a>.');
        }

      }
    });
  },


  // Starts duplication copy
  _importCopy: function(item_queue_id) {
    var self = this
    , imp = this.importation = new cdb.admin.Import({item_queue_id: item_queue_id})
    .bind("importComplete", function(e){
      imp.unbind();
      window.location.href = "/tables/" + imp.get("table_id") + "/";
    },this)
    .bind("importError", function(e){
      self._showError(e.attributes.error_code,e.attributes.get_error_text.title,e.attributes.get_error_text.what_about);
    },this);

    imp.pollCheck();
  },



  /**
  *  STATE 4 - Merging error :S
  */

  //Show the error when duplication fails
  _showError: function(number,description,wadus) {
    // Add data
    var template = cdb.templates.getTemplate("dashboard/views/error_dialog_content")
    , opts = {number: number, description: description, about:wadus};

    this.$el.find("div.error_content").html(template(opts));

    // Show error and hide importation window
    this._changeState();
  },



  /**
  *  GENERIC
  */

  // Changes state, just animate the change and add to state 1 (yes, always it goes forward, never backward)
  _changeState: function() {
    // Next state
    this.$el.find(".modal:eq(0)").animate({
      opacity: 0,
      marginTop: 0,
      height: 0,
      top: 0
    },600,function(){
      $(this).remove();
    });

    this.$el.find(".modal:eq(1)")
    .css({
      opacity:0,
      display:"block",
      marginTop: "0px"
    })
    .animate({
      opacity: 1,
      marginTop: -200
    },600);
  },


  // ESC prevent event
  _keydown: function(e) {
    // If clicks esc, goodbye unless select is opened!
    if (e.keyCode === 27) {
      if (!$('.select2-drop-active').is(':visible')) {
        this._cancel();
      } else {
        this.$el.find('select').select2('close')
      }

      // If clicks enter, same as you click on ok button.
    } else if (e.keyCode === 13 && this.options.enter_to_confirm) {
      this._ok();
    }
  },



  // When clicks on ok button or submit input
  _ok: function(ev) {
    if (ev) {ev.preventDefault()}
    if (!this.enabled) return false;

    // New state
    ++this.state;

    // Depending state
    switch (this.state) {
      case 1: this._focusInput();   break;
      case 2: this._startMerging(); break;
      default:
    }

    this._changeState();
  }
});
