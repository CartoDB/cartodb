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
      var MyDialog = cdb.ui.common.Dialog.extend({
        render_content: function() {
          return "my content";
        },
      })
      var dialog = new MyDialog({
          title: 'test',
          description: 'long description here',
          template_base: $('#base_template').html(),
          width: 500
      });

      $('body').append(dialog.render().el);
      dialog.open();
  
 * TODO: implement draggable
 * TODO: modal
 */

cdb.ui.common.Dialog = cdb.core.View.extend({

  tagName: 'div',
  className: 'dialog',

  events: {
    'click .ok': '_ok',
    'click .cancel': '_cancel'
  },

  default_options: {
    title: 'title',
    description: '',
    ok_title: 'ok',
    width: 300,
    height: 200,
    clean_on_hide: false
  },

  initialize: function() {
    _.defaults(this.options, this.default_options);
    this.template_base = _.template(this.options.template_base || cdb.templates.getTemplate('common/dialog') || '');
  },

  render: function() {
    var $el = this.$el;
    $el.css({
      width: this.options.width,
      height: this.options.height,
      'margin-left': -this.options.width>>1,
      'margin-top': -this.options.height>>1
    });
    $el.html(this.template_base(this.options));
    if(this.render_content) {
      this.$('.content').append(this.render_content());
    }
    return this;
  },

  _ok: function() {
    if(this.ok) {
      this.ok();
    }
    this.hide();
  },

  _cancel: function() {
    if(this.cancel) {
      this.cancel();
    }
    this.hide();
  },

  hide: function() {
    this.$el.hide();
    if(this.options.clean_on_hide) {
      this.clean();
    }
  },

  open: function() {
    this.$el.show();
  }

});
