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
  showAt: function(x, y, width) {
    this.$el.css({
      top: y,
      left: x,
      width: width
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


cdb.admin.EditDateDialog = cdb.admin.EditTextDialog.extend({
  // events: cdb.admin.EditTextDialog.extendEvents({
  //   "keyup .date": "checkValidity"
  // }),

  modal_class: 'edit_date_dialog',

  render_content: function() {
    return '<input type="date" class="date" data-placeholder="ex: 20/08/1979" ' +
    'pattern="^(0[1-9]|[12][0-9]|3[01])[- /.](0[1-9]|1[012])[- /.](19|20)\\d\\d$" ' +
    'value="' + (this.options.initial_value || "")+ '"></input>';
  },

  _ok: function() {
    if(this.hasValidDate()) {
      this.super('_ok');
    } else {
      alert('invalid date format  ');
    }
  },

  hasValidDate: function() {
    return this.$('.date').get(0).validity.valid;
  },

  checkValidity: function() {
    if(this.hasValidDate()) {
      this.enableSaveButton();
    } else {
      this.disableSaveButton();
    }
  },

  enableSaveButton: function() {

  },

  disableSaveButton: function() {
    console.log('falso')
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
        template_name: 'common/views/dialog_small_edit'
    });
    this.constructor.__super__.initialize.apply(this);
    this.$el.addClass('edit_text_dialog');
    this.input = self.$('textarea');
    self.input.attr('disabled', 'disabled');
    var the_geom = self.options.row.get('the_geom') || '';
    this.options.row.bind('change', function() {
        self.input.val(the_geom);
        self.input.removeAttr('disabled');
    }, this);
    this.options.row.fetch();
    this.add_related_model(this.options.row);
  },

  render_content: function() {
    // render loading if the GeoJSON is not loaded
    var geojson = this.options.row.get('the_geom');
    geojson = this.options.row.isGeomLoaded() ?
      geojson || '' :
      'loading...';

    return '<textarea placeholder="">' + geojson + '</textarea>';
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
