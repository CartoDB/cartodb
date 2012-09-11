
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

    $(document.body).find("div.table table").append(this.el);
  },

  /** show at position */
  showAt: function(x, y, width) {
    this.$el.css({
      top: y,
      left: x,
      minWidth: width
    });

    this.$el.find("textarea,input").css({
      minWidth: width - 22
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

  events: cdb.core.View.extendEvents({
    'keydown textarea': '_keyPress',
    'click': '_stopPropagation'
  }),

  initialize: function() {
    _.defaults(this.options, {
      template_name: 'common/views/dialog_small_edit',
      ok_title: 'Save',
      modal_class: 'edit_text_dialog',
      clean_on_hide: true
    });
    this.constructor.__super__.initialize.apply(this);

  },

  render_content: function() {
    return '<textarea>' + this.options.initial_value + '</textarea>';
  },

  _stopPropagation: function(e) {
    e.stopPropagation();
  },

  _keyPress: function(e) {
    if(e.keyCode === 13) {
      this._ok();
    }
  },

  ok: function() {
    if(this.options.res) {
      this.options.res(this.$('textarea').val());
    }
  }
});


cdb.admin.TagsDialog = cdb.admin.SmallDialog.extend({

  events: cdb.core.View.extendEvents({
    // 'keydown input': '_keyPress',
    'click': '_stopPropagation'
  }),

  initialize: function() {
    _.defaults(this.options, {
      template_name: 'common/views/dialog_small_edit',
      ok_title: 'Save',
      modal_class: 'edit_text_dialog',
      clean_on_hide: true
    });
    this.constructor.__super__.initialize.apply(this);

  },

  render_content: function() {
    return '<input value="' + this.options.initial_value + '"></input>';
  },

  _stopPropagation: function(e) {
    e.stopPropagation();
  },

  _keyPress: function(e) {
    if(e.keyCode === 13) {
      this._ok();
    }
  },

  ok: function() {
    if(this.options.res) {
      this.options.res(this.$('input').val());
    }
  }
});


cdb.admin.EditGeometryDialog = cdb.admin.SmallDialog.extend({

  events: cdb.core.View.extendEvents({
    'keydown input': '_keyPress'
  }),

  initialize: function() {
    var self = this;
    _.extend(this.options, {
        template_name: 'common/views/dialog_small_edit',
        ok_title: "Save"
    });
    this.constructor.__super__.initialize.apply(this);
    this.$el.addClass('edit_text_dialog');
    this.input = self.$('textarea');
    self.input.attr('disabled', 'disabled');
    this.options.row.bind('change', function() {
        self.input.val(self.options.row.get('the_geom'));
        self.input.removeAttr('disabled');
    }, this);
    this.options.row.fetch();
    this.add_related_model(this.options.row);
  },

  render_content: function() {
    // render loading if the GeoJSON is not loaded
    var geojson = this.options.row.get('the_geom');
    geojson = this.options.row.isGeomLoaded() ? geojson: 'loading...';
    return '<textarea>' + geojson + '</textarea>';
  },

  _keyPress: function(e) {
    if(e.keyCode === 13) {
      this._ok();
    }
  },

  ok: function() {
    if(this.options.res) {
      this.options.res(this.input.val());
    }
  }

});
