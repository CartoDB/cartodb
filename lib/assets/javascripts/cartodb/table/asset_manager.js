

  cdb.admin.AssetManager = cdb.admin.BaseDialog.extend({

    _TEXTS: {
      title:  _t('Select a marker image'),
      ok:     _t('Set image')
    },

    events: function(){
      return _.extend({},cdb.admin.BaseDialog.prototype.events,{ });
    },

    initialize: function() {
      _.extend(this.options, {
        title: this._TEXTS.title,
        description: '',
        template_name: 'common/views/dialog_base',
        clean_on_hide: true,
        ok_button_classes: "button grey disabled",
        cancel_button_classes: "hide",
        ok_title: this._TEXTS.ok,
        modal_type: "creation",
        width: 600
      });
      this.constructor.__super__.initialize.apply(this);
    },

    render_content: function() {
      var $content = $('<div>');
      var temp_content = this.getTemplate('table/views/asset_manager');
      console.log(this.options.user);
      console.log(new cdb.admin.Assets({ user: this.options.user }).fetch());
      $content.append(temp_content());

      return $content;
    },



    // Visibility functions

    _showLoader: function() {
      this.$el.
    },

    _hideLoader: function() {
      this.$('.loader')
    }


  })