  /**
   *  Edit Number dialog, comes from Small Dialog -> cell editor!
   *
   *  Associate templates:
   *    - dialog_small_edit
   */

  cdb.admin.EditNumberDialog = cdb.admin.SmallDialog.extend({

    className: "floating edit_text_dialog number_dialog",

    events: cdb.core.View.extendEvents({
      'keyup textarea': '_keyPress',
      'click': '_stopPropagation'
    }),

    initialize: function() {
      _.defaults(this.options, {
        template_name: 'common/views/dialog_small_edit',
        ok_title: 'Save',
        modal_class: 'edit_text_dialog',
        clean_on_hide: true
      });

      this.enable = true;

      cdb.ui.common.Dialog.prototype.initialize.apply(this);
      this.render();
      $(document.body).find("div.table table").append(this.el);
    },


    render_content: function() {
      var val = '';
      if (this.options.initial_value === 0 || this.options.initial_value === "0") {
        val = '0';
      } else if (this.options.initial_value) {
        val = this.options.initial_value;
      }
      return '<textarea>' + val + '</textarea>';
    },


    /**
     *  Stop propagation click event
     */
    _stopPropagation: function(e) {
      e.stopPropagation();
    },


    /**
     *  Check if the number is well formed or not
     */
    _checkNumber: function(number) {
      var pattern = /^-?(?:[0-9]+|[0-9]*\.[0-9]+)$/;
      if (pattern.test(number)) {
        return true
      } else {
        return false
      }
    },


    /**
     *  Check the number everytime user press a key
     */
    _keyPress: function(ev) {
      var number = $(ev.target).val();

      if (this._checkNumber(number)) {
        this.enable = true;
        $(ev.target).removeClass("error");

        if(ev.keyCode === 13) {
          this._ok();
        }
      } else {
        $(ev.target).addClass("error");
        this.enable = false;

        if(ev.keyCode === 13) {
          ev.preventDefault();
        }
      }
    },


    /**
     *  Overwrite the show function
     */
    showAt: function(x, y, width, fix) {
      this.$el.css({
        top: y,
        left: x,
        minWidth: width
      });

      if (fix) {
        this.$el.find("textarea").css({
          minWidth: width - 22
        })
      }

      this.show();
      this.$el.find("textarea")
        .focus()
        .select();
    },


    /**
     *  Ok button function
     */
    _ok: function(ev) {
      if(ev) ev.preventDefault();

      // If the time is not ok, the dialog is not correct
      if (!this.enable) {
        return false;
      }

      if (this.ok) {
        this.ok();
      }

      this.hide();
    },


    /**
     *  Ok button function
     */
    ok: function() {
      var number = this.$el.find("textarea").val();
      if(this.options.res) {
        this.options.res(number);
      }
    }
  });
