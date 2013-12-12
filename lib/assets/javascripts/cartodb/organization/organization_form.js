
  
  /**
   *  Organization form 
   *
   */


  cdb.admin.organization.Form = cdb.core.View.extend({

    _TEXTS: {
      delete: {
        title: _t("Delete <%= username %>'s account"),
        description: _t("You are about to delete <%= username %> account. Doing so will delete all tables and visualizations. Are you sure?"),
        ok: _t("Yes, do it")
      }
    },

    events: {
      'click .delete':        '_onDeleteClick',
      'click .change_quota':  '_onChangeQuotaClick'
    },

    initialize: function() {
      this.user = this.options.user;
      this._initViews();
      this._initBinds();
    },

    render: function() {
      return this;
    },

    _initViews: function() {

      // Field errors
      if (this.$('div.field > div.error').length > 0) {
        this.$('div.error').each(this._setFieldError);
      }

      // Quota used

    },

    _initBinds: function() {
      this.user.bind('change:quota_in_bytes', function(m, quota) {
        this.render();
        this.$("#user_quota").val(quota)
      }, this)
    },

    _setFieldError: function(pos, el) {
      var $field = $(el).closest('div.field');
      $field.addClass('field_with_errors');

      $(el).tipsy({
        fade: true,
        gravity: "s",
        offset: 5,
        className: 'error_tooltip',
        title: function() {
          return $(this).text()
        }
      });
    },

    _onChangeQuotaClick: function(e) {
      if (e) e.preventDefault();

      var dlg = new cdb.admin.organization.QuotaDialog({
        user: this.user,
        collection: this.collection,
        organization: this.model
      });

      dlg
        .appendToBody()
        .open();
    },

    _onDeleteClick: function(e) {
      if (e) e.preventDefault();
      var href = $(e.target).attr('href');
      var self = this;

      var dlg = new cdb.admin.BaseDialog({
        title: _.template(this._TEXTS.delete.title)(this.user.toJSON()),
        description: _.template(this._TEXTS.delete.description)(this.user.toJSON()),
        template_name: 'common/views/confirm_dialog',
        clean_on_hide: true,
        enter_to_confirm: true,
        ok_button_classes: "right button grey",
        ok_title: this._TEXTS.delete.ok,
        cancel_button_classes: "underline margin15",
        modal_type: "error",
        width: 500
      });

      dlg.ok = function() {
        self.user.destroy({
          sucess: function() {
            window.location.href = "/organization"
          }
        })
      }

      dlg
        .appendToBody()
        .open();
    }

  });



  
