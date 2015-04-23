
  /**
   *  User settings dropdown
   *
   *  new cdb.admin.UserSettingsDropdown({
   *    template_base: 'template_base_path',
   *    model: user_model
   *  })
   *  
   *  Also, cdb.config has to be defined!
   *
   */


  cdb.admin.UserSettingsDropdown = cdb.admin.DropdownMenu.extend({

    render: function() {
      // Render
      var $el = this.$el;

      var data = {
        username: this.model.get('username'),
        isOrgAdmin: this.model.isOrgAdmin(),
        isInsideOrg: this.model.isInsideOrg(),
        newDashboardEnabled: this.model.featureEnabled('new_dashboard'),
        account_host: cdb.config.get('account_host')
      };

      $el
        .html(this.template_base(data))
        .css({
          width: this.options.width
        })
      return this;
    }

  })
