
  /**
   *  Edit Date dialog, comes from Small Dialog -> cell editor!
   * 
   *  Associate templates:
   *    - dialog_small_edit
   *    - boolean_editor
   */

  cdb.admin.EditBooleanDialog = cdb.admin.SmallDialog.extend({

    className: "floating edit_text_dialog boolean_dialog",

    events: cdb.core.View.extendEvents({
      'click nav a': '_optionClicked'
    }),

    initialize: function() {
      _.defaults(this.options, {
        template_name: 'common/views/dialog_small_edit',
        ok_title: 'Save',
        modal_class: 'edit_text_dialog',
        clean_on_hide: true
      });

      // Set flag when time fails or is OK
      this.enable = true;

      // Generate model
      this.model = new Backbone.Model();

      // Super!
      cdb.ui.common.Dialog.prototype.initialize.apply(this);

      // Render
      this.render();

      // Add the dialog to the body
      $(document.body).find("div.table table").append(this.el);
    },


    /**
     *  Render content
     */
    render_content: function() {
      var value = (this.options.initial_value == '' || this.options.initial_value == null) ? null : this.options.initial_value;

      this.model.set("value", value);

      var template = cdb.templates.getTemplate("table/cell_editors/views/boolean_editor")
        , $content = this.$content = $("<div>").append(template(this.model.toJSON()));

      if (value == null) {
        $content.find(".null").addClass("selected");
      } else if (!value) {
        $content.find(".false").addClass("selected");
      } else {
        $content.find(".true").addClass("selected");
      }

      return $content;
    },


    /**
     *  Change option when clicked
     */
    _optionClicked: function(ev) {
      ev.preventDefault();

      var $el = $(ev.target);

      if ($el.hasClass("selected"))
        return false;

      // Change selected
      $el.closest("nav").find("a.selected").removeClass("selected");
      $el.closest("a").addClass("selected");
      var value = this.toBoolean($el.closest('a').attr('data-value').toLowerCase());

      // Change model
      this.model.set("value", value);
    },


    /**
     *  String to boolean
     */
    toBoolean: function(str) {
      switch(str.toLowerCase()){
        case "true": case "yes": case "1": return true;
        case "false": case "no": case "0": return false;
        default: return null;
      }
    },


    /**
     *  Overwrite the show function
     */
    showAt: function(x, y, width, fix) {

      var dialog_width = this.$el.width();

      this.$el.css({
        top: y,
        left: x + (width - dialog_width) / 2,
        minWidth: dialog_width,
        maxWidth: dialog_width
      });

      this.show();
    },


    /**
     *  Ok button function
     */
    ok: function(ev) {
      if(this.options.res) {
        this.options.res(this.model.toJSON().value);
      }
    }
  });