
  
  /**
   *  Organization form view
   *
   *  - Where user can change/create password.
   *  - Change username.
   *  - Change quota assigned.
   *
   */


  cdb.admin.organization.Form = cdb.core.View.extend({

    _TEXTS: {
      delete: {
        title:        _t("Delete <%- username %>'s account"),
        description:  _t("You are about to delete <%- username %> account. \
                          Doing so will delete all tables and visualizations. \
                          Are you sure?"),
        ok:           _t("Yes, do it")
      },
      assigned:       _t("assigned")
    },

    events: {
      'change input[type="file"]':  '_onFileChange',
      'click .delete':              '_onDeleteClick',
      'click .change_quota':        '_onChangeQuotaClick'
    },

    initialize: function() {
      this.user = this.options.user;

      // Set user quota from input if
      this._setUserQuota();

      this._initViews();
      this._initBinds();
    },

    render: function() {
      this.clearSubViews();

      // Quota assigned label
      this.$('label strong').text(
        cdb.Utils.readablizeBytes(this.user.get('quota_in_bytes')) +
        " " + 
        this._TEXTS.assigned
      );

      // Organization quota progress
      var progress_bar = new cdb.admin.organization.ProgressQuota({
        model: this.model,
        user: this.user,
        collection: this.collection,
        paths: this.options.paths
      });
      
      this.$('.progress-bar').html(progress_bar.render().el);
      this.addView(progress_bar);

      return this;
    },

    _setUserQuota: function() {
      if (!this.user.get('username')) {
        this.user.set('quota_in_bytes', this.$("#user_quota").val());
      }
    },

    _initViews: function() {
      // Field errors
      if (this.$('div.field > div.field_error').length > 0) {
        this.$('div.field_error').each(this._setFieldError);
      }

      // File input style
      this.$("div.field :file").filestyle();
    },

    _initBinds: function() {
      this.user.bind('change:quota_in_bytes', function(m, quota) {
        this.$("#user_quota").val(quota);
        this.render();
      }, this)
    },

    _onFileChange: function(e) {
      var $div = $(e.target).parent();
      $div.find('label.btn').hide();
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
          beforeSend: function(xhr) {
            xhr.setRequestHeader(
              'X-CSRF-Token',
              $('meta[name="csrf-token"]').attr('content')
            );
          },
          success: function() {
            window.location.href = self.options.paths.organization;
          }
        });
      }

      dlg
        .appendToBody()
        .open();
    }

  });
