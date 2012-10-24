  /**
   * Shows a dialog wher you cannot share a map view
   * new NoShareMapDialog({
   *  table: table_model
   * })
   *
   */

  cdb.admin.NoShareMapDialog = cdb.admin.BaseDialog.extend({

    events: cdb.core.View.extendEvents({}),

    initialize: function() {
      var self = this;

      _.bindAll(this, '_changePrivacy');

      _.extend(this.options, {
        title: _t("We could not share your data"),
        description: '',
        template_name: 'common/views/dialog_base',
        clean_on_hide: true,
        ok_button_classes: "button grey",
        ok_title: "Close",
        modal_type: "notification",
        width: 500,
        modal_class: 'no_share_table'
      });
      this.constructor.__super__.initialize.apply(this);
      this.bind("clean", this._reClean);
    },


    render_content: function() {
      var $content = this.$content = $("<div>")
        , temp_content = this.getTemplate('table/views/no_share_map_content');

      $content.append(temp_content);
      $content.find("a.public").bind('click', this._changePrivacy);

      return $content;
    },

    _changePrivacy: function(ev) {
      ev.preventDefault();
      
      this.ok = function(){
        var self = this;
        setTimeout(function(){
          self.$el.closest("body").find('header a.status.rounded_white').click();  
        },200);
      };

      this._ok();
    },

    _reClean: function() {
      this.$el.find("a.public").unbind("click");
    }
  });
