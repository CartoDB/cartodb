/**
 * generic dialog
 *
 * this opens a dialog in the middle of the screen rendering
 * a dialog using cdb.templates 'common/dialog' or template_base option.
 *
 * inherit class should implement render_content (it could return another widget)
 *
 * usage example:
 *
 *    var MyDialog = cdb.ui.common.Dialog.extend({
 *      render_content: function() {
 *        return "my content";
 *      },
 *    })
 *    var dialog = new MyDialog({
 *        title: 'test',
 *        description: 'long description here',
 *        template_base: $('#base_template').html(),
 *        width: 500
 *    });
 *
 *    $('body').append(dialog.render().el);
 *    dialog.open();
 *
 * TODO: implement draggable
 * TODO: modal
 * TODO: document modal_type
 */

cdb.ui.common.Dialog = cdb.core.View.extend({

  tagName: 'div',
  className: 'dialog',

  events: {
    'click .ok': '_ok',
    'click .cancel': '_cancel',
    'click .close': '_cancel'
  },

  default_options: {
    title: 'title',
    description: '',
    ok_title: 'Ok',
    cancel_title: 'Cancel',
    width: 300,
    height: 200,
    clean_on_hide: false,
    enter_to_confirm: false,
    template_name: 'common/views/dialog_base',
    ok_button_classes: 'button green',
    cancel_button_classes: '',
    modal_type: '',
    modal_class: '',
    include_footer: true,
    additionalButtons: []
  },

  initialize: function() {
    _.defaults(this.options, this.default_options);

    _.bindAll(this, 'render', '_keydown');

    // Keydown bindings for the dialog
    $(document).bind('keydown', this._keydown);

    // After removing the dialog, cleaning other bindings
    this.bind("clean", this._reClean);

    this.template_base = this.options.template_base ? _.template(this.options.template_base) : cdb.templates.getTemplate(this.options.template_name);
  },

  render: function() {
    var $el = this.$el;

    $el.html(this.template_base(this.options));

    $el.find(".modal").css({
      width: this.options.width
      //height: this.options.height
      //'margin-left': -this.options.width>>1,
      //'margin-top': -this.options.height>>1
    });

    if(this.render_content) {

      this.$('.content').append(this.render_content());
    }

    if(this.options.modal_class) {
      this.$el.addClass(this.options.modal_class);
    }

    return this;
  },


  _keydown: function(e) {
    // If clicks esc, goodbye!
    if (e.keyCode === 27) {
      this._cancel();
    // If clicks enter, same as you click on ok button.
    } else if (e.keyCode === 13 && this.options.enter_to_confirm) {
      this._ok();
    }
  },

  /**
   * helper method that renders the dialog and appends it to body
   */
  appendToBody: function() {
    $('body').append(this.render().el);
    return this;
  },

  _ok: function(ev) {

   if(ev) ev.preventDefault();

    if (this.ok) {
      this.ok(this.result);
    }

    this.hide();

  },

  _cancel: function(ev) {

    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }

    if (this.cancel) {
      this.cancel();
    }

    this.hide();

  },

  hide: function() {

    this.$el.hide();

    if (this.options.clean_on_hide) {
      this.clean();
    }

  },

  open: function() {

    this.$el.show();

  },

  _reClean: function() {

    $(document).unbind('keydown', this._keydown);

  }

});
