  /**
   *  Editor small dialog where cell editor will be placed on it.
   */

  cdb.admin.SmallEditorDialog = cdb.admin.SmallDialog.extend({

    initialize: function() {
      _.defaults(this.options, {
        template_name: 'old_common/views/dialog_small_edit',
        ok_title: 'Save',
        modal_class: 'edit_text_dialog',
        clean_on_hide: true
      });

      cdb.ui.common.Dialog.prototype.initialize.apply(this);
      this.render();

      // Ouch!!
      $(document.body).find("div.table table").append(this.el);
    },

    /**
     *  Render correct editor
     */
    render_content: function() {
      var $content  = $('<div>');
      
      if (this.options.editorField) {
        this.editor   = new this.options.editorField({
                        label:      false,
                        autoResize: false,
                        rowNumber:  this.options.rowNumber,
                        row:        this.options.row,
                        readOnly:   this.options.readOnly,
                        model: new cdb.core.Model({
                          attribute:  this.options.column,
                          value:      this.options.value
                        })
                      }).bind("ENTER", this._ok, this);

        $content.append(this.editor.render().el);
        this.addView(this.editor);
      }

      return $content;
    },


    /**
     *  Overwriting the show function
     */
    showAt: function(x, y, width, fix) {
      this.$el.css({
        top: y,
        left: x,
        minWidth: width
      });

      if (fix) {
        this.$el.find("textarea").css({
          'min-width': width - 22
        })
      }

      this.show();
      this.$el.find("textarea, input")
        .focus()
        .select();
    },


    /**
     *  Ok button function
     */
    _ok: function(ev) {
      if(ev) ev.preventDefault();

      // If the time is not ok, the dialog is not correct
      if (!this.editor.isValid()) {
        return false;
      }

      if (this.options.res) {
        this.options.res(this.editor.model.get('value'));
      }

      this.hide();
    }

  });
