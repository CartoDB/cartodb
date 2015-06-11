
/**
 * Duplicate confirmation window, it could come from a query or a plain table (extends Dialog)
 *
 * When you want to DUPLICATE a table or FROM A QUERY, it needs a new table name
 *
 * Usage example:
 *
 *  var duplicate_dialog = new cdb.admin.DuplicateTableDialog({
 *    model: table_model
 *  });
 *
 *  state - 0 -> Choose a name for the new table (duplicated or from a query)
 *  state - 1 -> Creating/duplicating table proccess
 *  state - 2 -> If we can see this state, bad news, there was an error during the previous process.
 *
 */

cdb.admin.DuplicateTableDialog = cdb.admin.BaseDialog.extend({

  _TEXTS: {
    title: {
      normal:   _t('Name for your copy of this dataset'),
      query:    _t('Name your new dataset from this query')
    },
    ok_button: {
      normal:   _t('Duplicate dataset'),
      query:    _t('Create dataset')
    },
    error: {
      default:  _t('Sorry, something went wrong and we\'re not sure what. Contact us at \
                  <a href="mailto:support@cartodb.com">support@cartodb.com</a>.')
    }
  },

  initialize: function() {
    var inSQLMode = this.model.isInSQLView && this.model.isInSQLView();

    _.extend(this.options, {
      title: this.options.title || (inSQLMode ? this._TEXTS.title.query : this._TEXTS.title.normal),
      description: '',
      template_name: 'table/header/views/duplicate_table_dialog_base',
      clean_on_hide: true,
      ok_button_classes: "button grey",
      ok_title: inSQLMode ? this._TEXTS.ok_button.query : this._TEXTS.ok_button.normal,
      cancel_button_classes: "underline",
      modal_type: "creation",
      width: 525,
      modal_class: 'duplicate_dialog'
    });

    this.elder('initialize');
    _.bindAll(this, '_onKeyDown');

    this.state = 0;
  },

  render_content: function() {
    var $content = this.$content = $("<div>")
      , template = cdb.templates.getTemplate('table/header/views/duplicate_table_dialog');

    $content.append(template({ table_name: this.model.get('name'), queryApplied: this.model.isInSQLView() }));
    $content.find("input.text").bind("keydown", this._onKeyDown)

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
    var template = this.getTemplate("table/header/views/duplication_loader_dialog");

    this.$el.find(".modal:eq(1)").find("div.duplicate_content").html(template({ type:'table', queryApplied: this.model.isInSQLView() }));

    // Show next modal window
    this._changeState();

    // Duplicate table now!!!!!!!
    this._startDuplication();
  },

  /**
   *  Start duplication of the table
   */
  _startDuplication: function() {
    var self = this;
    this.model.duplicate(this.copy_name, {
      success: function(newTable) {
        window.location.href = newTable.viewUrl();
      },
      error: function(e) {
        try {
          self._showError(e.attributes.error_code,e.attributes.get_error_text.title,e.attributes.get_error_text.what_about);
        } catch(e) {
          self._showError('99999','Unknown', self._TEXTS.error.default);
        }
      }
    });
  },

  /**
   *  Show the error when duplication fails
   */
  _showError: function(number,description,wadus,item_queue_id) {
    // Add data
    var template = cdb.templates.getTemplate("old_common/views/error_dialog_content")
      , opts = {number: number, description: description, about:wadus, item_queue_id: item_queue_id};

    this.$("div.error_content").html(template(opts));

    // Show error and hide importation window
    this._changeState();
  },


  /**
   *  Changes state, just animate the change and add to state 1 (yes, always it goes forward, never backward)
   */
  _changeState: function() {
    this.state++;

    // Next state
    this.$(".modal:eq(0)").animate({
      opacity: 0,
      marginTop: 0,
      height: 0,
      top: 0
    },function(){
      $(this).remove();
    });

    this.$(".modal:eq(1)")
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
   *  Remove any custom binding previously applied
   */
  clean: function() {
    this.$("input.text").unbind("keydown");
    cdb.admin.BaseDialog.prototype.clean.call(this);
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
