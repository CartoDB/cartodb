

  /**
   *  Dialog to name the new visualization
   *  - It don't need any model or specific option
   */

  cdb.admin.NameVisualization = cdb.admin.BaseDialog.extend({

    _TEXTS: {
      title:  _t('Save your map'),
      desc:   _t('A map is a mix of layers, styles and SQL. Your \
              maps are now accessible from your dashboard.'),
      button: _t('Create map'),
      error:  _t('The map name can\'t be blank')
    },

    events: cdb.core.View.extendEvents({
      "keydown input":    "_checkEnter"
    }),

    initialize: function() {
      // Extend options
      _.extend(this.options, {
        title: this._TEXTS.title,
        description: this._TEXTS.desc,
        template_name: 'common/views/dialog_base',
        clean_on_hide: true,
        ok_button_classes: "button green",
        ok_title: this._TEXTS.button,
        modal_type: "creation",
        modal_class: "name_visualization",
        width: 450,
        error_messages: {
          blank: this._TEXTS.error
        }
      });
      this.constructor.__super__.initialize.apply(this);
    },

    render_content: function() {
      var $content = this.$content = $("<div>");
      this.template = cdb.templates.getTemplate('dashboard/views/name_visualization_dialog');
      $content.append(this.template(this.options));

      // Focus in the input trick
      setTimeout(function() {
        $content.find("input").focus();
      },300);

      return $content;
    },

    _checkEnter: function(e) {
      var code = (e.keyCode ? e.keyCode : e.which);
      if(code == 13) {
        this.killEvent(e);
        this._ok();
      }
    },

    _isValidName: function() {
      var value = this.$content.find('input').val();
      return value.length > 0 && value != " ";
    },

    _showError: function() {
      this.$('div.info').addClass('active error');
    },

    _hideError: function() {
      this.$('div.info').removeClass('active');
    },

    _ok: function(ev) {
      this.killEvent(ev);

      var value = this.$content.find('input').val();

      if (this._isValidName(value)) {
        this._hideError();
        this.options.onResponse && this.options.onResponse(value);
        this.hide();
      } else {
        this._showError();
      }

    }
  });
