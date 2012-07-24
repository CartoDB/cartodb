
/**
 * base class for all small dialogs
 * inherit from this class, see EditTextDialog 
 * for an example
 */
cdb.admin.SmallDialog = cdb.ui.common.Dialog.extend({

  className: 'floating',

  initialize: function() {
    _.extend(this.options, {
              title: '',
              description: '',
              clean_on_hide: true
    });
    cdb.ui.common.Dialog.prototype.initialize.apply(this);
    this.render();
    $(document.body).append(this.el);
  },

  /** show at position */
  showAt: function(x, y) {
    this.$el.css({
      top: y,
      left: x
    })
    this.show();
  },

  /**
   * show the dialog on top of an element
   * useful in events:
      dlg.showAtElement(e.target);
   */
  showAtElement: function(el) {
    var pos = $(el).offset();
    this.showAt(pos.left, pos.top);
  }

});


cdb.admin.EditTextDialog = cdb.admin.SmallDialog.extend({

  //events: cdb.core.View.extendEvents({ }),

  initialize: function() {
    _.extend(this.options, {
        template_name: 'common/views/dialog_small_edit',
    });
    this.constructor.__super__.initialize.apply(this);
  },

  render_content: function() {
    return '<input value="' + this.initial_value + '"></input>';
  }

});
