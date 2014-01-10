
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
      var data = _.extend(this.model.toJSON(),cdb.config.toJSON());

      $el
        .html(this.template_base(data))
        .css({
          width: this.options.width
        })
      return this;
    }

  })