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
    var input = '<input value="' + this.options.initial_value.replace(/\"/g,'&quot;').replace(/\'/g,"&#39;") + '" ';
    if(this.options.maxLength) {
      input += 'maxLength = ' + this.options.maxLength;
    }
    input += ' type="text"/>';
    return input;
  },

  _stopPropagation: function(e) {
    e.stopPropagation();
  },

  _focusInput: function() {
    var self = this;
    setTimeout(function(){
      var width = self.$el.outerWidth() - self.$el.find("a.button").outerWidth() - 35;
      self.$el.find("input").width(width).focus();
    },0);
  },

  _keyPress: function(e) {
    if(e.keyCode === 13) {
      this._ok();
    }
  },

  ok: function() {
    if(this.options.onResponse) {
      this.options.onResponse(this.$('input').val());
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
      , list  = this.options.initial_value
      , self  = this;

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
    if (this.options.onResponse) {
      var tags = [];
      this.$el.find("li span.tagit-label").each(function(i,el){
        tags.push($(this).text());
      });

      this.$list.tagit("destroy");
      this.options.onResponse(tags);
    }
  }
});
