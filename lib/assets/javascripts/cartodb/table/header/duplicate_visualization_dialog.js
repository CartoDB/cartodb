
/**
 *
 * Duplicate confirmation window, it comes from a Visualization model (extends Dialog)
 *
 * When you want to DUPLICATE a visualization it needs a new name
 *
 * Usage example:
 *
 *  var duplicate_vis_dialog = new cdb.admin.DuplicateVisDialog({
 *    model: vis_model
 *  });
 *
 *  state - 0 -> Choose a name for the new visualization
 *  state - 1 -> Creating/duplicating vis proccess
 *  state - 2 -> If we can see this state, bad news, there was an error during the previous process.
 *
 */

cdb.admin.DuplicateVisDialog = cdb.admin.BaseDialog.extend({

  _TEXTS: {
    title: _t('Name for your copy of this map'),
    ok_button: _t('Duplicate map'),
    error: _t('Sorry, something went wrong and we\'re not sure what. Contact us at \
                  <a href="mailto:support@cartodb.com">support@cartodb.com</a>.')
  },

  initialize: function() {
    _.extend(this.options, {
      title: this._TEXTS.title,
      description: '',
      template_name: 'table/header/views/duplicate_vis_dialog_base',
      clean_on_hide: true,
      ok_button_classes: "button grey",
      ok_title: this._TEXTS.ok_button,
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
      , template = cdb.templates.getTemplate('table/header/views/duplicate_vis_dialog');

    $content.append(template({ vis_name: this.model.get('name') }));
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
  _checkCopyName: function(vis_name, copy_vis_name) {
    if (copy_vis_name.length > 0 && vis_name != copy_vis_name) {
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
    var template = this.getTemplate("table/header/views/duplication_loader_dialog")
      , opts = { type : 'visualization', queryApplied: false };

    this.$el.find(".modal:eq(1)").find("div.duplicate_content").html(template(opts));

    // Show next modal window
    this._changeState();

    // Duplicate visualization now!!!!!!!
    this._startDuplication();
  },

  /**
   *  Start duplication of the vis
   */
  _startDuplication: function() {
    var self = this
      , data = {
        name: this.copy_name,
        source_visualization_id: this.model.get('id')
      };

    this.model.copy({
      name: this.copy_name
    }, {
      success:function(new_vis) {
        window.location.href = new_vis.viewUrl();
      },
      error: function(e) {
        try {
          self._showError(e.attributes.error_code,e.attributes.get_error_text.title,e.attributes.get_error_text.what_about);
        } catch(e) {
          self._showError('99999','Unknown', self._TEXTS.error);
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
      , opts = {number: number, description: description, about:wadus, item_queue_id:item_queue_id};

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
