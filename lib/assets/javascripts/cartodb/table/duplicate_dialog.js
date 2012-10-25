
/**
 * Duplicate confirmation window (extends Dialog)
 *
 * When you want to duplicate a table, it needs a new table_name
 *
 * Usage example:
 *
    var duplicate_dialog = new cdb.admin.DuplicateDialog({
      model: table_model
    });

    state - 0 -> Typing new copy name
    state - 1 -> Duplicating
    state - 2 -> Error :S
 *
 */

cdb.admin.DuplicateTable = cdb.admin.BaseDialog.extend({

  initialize: function() {
    _.extend(this.options, {
      title: "Insert a name for your copy of this table",
      description: '',
      template_name: 'table/views/duplicate_table_dialog_base',
      clean_on_hide: true,
      ok_button_classes: "button grey",
      ok_title: "Duplicate table",
      cancel_button_classes: "underline margin15",
      modal_type: "creation",
      width: 525,
      modal_class: 'duplicate_table_dialog'
    });
    this.elder('initialize');
    _.bindAll(this, '_onKeyDown');

    this.state = 0;
  },

  render_content: function() {
    var $content = this.$content = $("<div>")
      , template = cdb.templates.getTemplate('table/views/duplicate_table_dialog');

    $content.append(template());
    $content.find("input.text")
      .bind("keydown", this._onKeyDown)
      
    // Hack to focus in the input
    setTimeout(function() {
      $content.find("input.text").focus();
    },300)

    return this.$content;
  },


  /**
   * Check if input value is correct or not
   */
  _checkCopyName: function(table_name, copy_table_name) {
    if (copy_table_name.length > 0 && table_name != copy_table_name) {
      return true
    } else {
      return false
    }
  },


  /**
   * If users type ENTER
   */
  _onKeyDown: function(ev) {
    if(ev.keyCode === 13) {
      this._ok();
    }
  },


  /**
   * Show or hide input error
   */
  _toggleInputError: function(active) {
    if (active) {
      this.$el.find("div.info").addClass("active");
    } else {
      this.$el.find("div.info").removeClass("active");
    }
  },


  /**
   * Show the loader window
   */
  _showLoader: function() {
    // Add data
    var template = this.getTemplate("table/views/duplication_loader_dialog")
      , opts = {table_name : this.model.get("name")}

    this.$el.find(".modal:eq(1)").find("div.duplicate_content").html(template(this.opts));

    // Show next window
    this._changeState();

    // Duplicate table now!!!!!!!
    this._startDuplication();
  },


  /**
   *  Start duplication of the table
   */
  _startDuplication: function() {
    var self = this;

    $.ajax({
      type: "POST",
      url: "/api/v1/imports",
      data: {table_copy: this.model.get('name'), table_name: this.copy_name },
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


  /**
   *  Starts duplication copy
   */
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
   *  Show the error when duplication fails
   */
  _showError: function(number,description,wadus) {
    // Add data
    var template = cdb.templates.getTemplate("dashboard/views/error_dialog_content")
      , opts = {number: number, description: description, about:wadus};

    this.$el.find("div.error_content").html(template(opts));

    // Show error and hide importation window
    this._changeState();
  },


  /**
   *  Changes state, just animate the change and add to state 1 (yes, always goes forward, never backward)
   */
  _changeState: function() {
    this.state++;

    // Next state
    this.$el.find(".modal:eq(0)").animate({
      opacity: 0,
      marginTop: 0,
      height: 0,
      top: 0
    },function(){
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
        marginTop: "100px"
      },600);
  },


  /**
   *  ESC button cancel the duplication if the app is not duplicating (state - 1)
   */
  _keydown: function(e) {
    if (e.keyCode === 27 && this.state != 1) {
      this._cancel();
    }
  },


  /**
   *  When clicks on ok button or submit input
   */
  _ok: function(ev) {
    if (ev)
      ev.preventDefault();

    var copy_name = this.$el.find("input.text").val();

    if (this._checkCopyName(this.model.get('name'),copy_name)) {
      this._toggleInputError(false);
      this.copy_name = copy_name;
      this._showLoader();
    } else {
      this._toggleInputError(true);
    }
  }
});
