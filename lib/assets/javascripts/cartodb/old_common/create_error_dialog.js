
/**
 * Creation error window (extends BaseDialog)
 *
 * When you need to show a table creation error
 *
 * Usage example:
 *
    var dialog = new cdb.admin.CreateErrorDialog({
      model: import_info
    });
 *
 */

cdb.admin.CreateErrorDialog = cdb.admin.BaseDialog.extend({

  initialize: function() {
    _.extend(this.options, {
      title: "An error occurred when importing your data",
      description: '',
      clean_on_hide: true,
      ok_button_classes: "button grey",
      ok_title: "Ok, close it",
      cancel_button_classes: "underline margin15",
      modal_type: "confirmation",
      width: 600,
      modal_class: 'error'
    });
    this.constructor.__super__.initialize.apply(this);
  },

  render_content: function() {
    var template = cdb.templates.getTemplate('old_common/views/error_dialog_content')
      , info = {
        number: this.model.error_code,
        description: this.model.get_error_text.title,
        about: this.model.get_error_text.what_about,
        item_queue_id: ''
      }
    this.$content = template(info);
    this.$el.find("div.content").addClass("error_content").removeClass("content");
    
    return this.$content;
  }
});
