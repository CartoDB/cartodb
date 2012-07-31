
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

  events: cdb.core.View.extendEvents({
    'keydown input': '_keyPress'
  }),

  initialize: function() {
    _.extend(this.options, {
        template_name: 'common/views/dialog_small_edit',
        ok_title: 'Save'
    });
    this.constructor.__super__.initialize.apply(this);
    this.$el.addClass('edit_text_dialog');

  },

  render_content: function() {
    return '<input value="' + this.options.initial_value + '"></input>';
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
        template_name: 'common/views/dialog_small_edit'
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
