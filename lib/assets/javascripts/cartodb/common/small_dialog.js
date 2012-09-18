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
  showAt: function(x, y, width, fix) {
    this.$el.css({
      top: y,
      left: x,
      minWidth: width
    });

    if (fix) {
      this.$el.find("> textarea, > input").css({
        minWidth: width - 22
      })
    }

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
    'keypress input': '_keyPress',
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
    this._focusInput();
    return '<input value="' + this.options.initial_value + '"/>';
  },

  _stopPropagation: function(e) {
    e.stopPropagation();
  },

  _focusInput: function() {
    var self = this;
    setTimeout(function(){
      self.$el.find("input").focus();
    },0);
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




cdb.admin.TagsDialog = cdb.admin.SmallDialog.extend({

  className: "floating edit_name_dialog tags-dialog",

  events: cdb.core.View.extendEvents({
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
    
    var $list = this.$list = $("<ul>")
      , list = this.options.initial_value.split(',')
      , self = this;

    _.each(list, function(li) {
      $list.append("<li>" + li + "</li>");
    });

    $list.tagit({
      allowSpaces: true,
      onSubmitTags: function(ev,tagList) {
        self.$el.find("a.ok").click();
      }
    });

    this._focusInput();

    return $list;
  },

  _stopPropagation: function(e) {
    e.stopPropagation();
  },

  _focusInput: function() {
    var self = this;
    setTimeout(function(){
      self.$el.find("input").focus();
    },0);
  },

  ok: function() {
    if (this.options.res) {
      var tags = "";
      this.$el.find("li span.tagit-label").each(function(i,el){
        if (i!=0) tags += ",";
        tags += $(this).text();
      });

      this.$list.tagit("destroy");
      this.options.res(tags);
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
      title: '',
      description: '',
      clean_on_hide: true
    });
    
    cdb.ui.common.Dialog.prototype.initialize.apply(this);
    this.render();
    $(document.body).find("div.table table").append(this.el);

    
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
