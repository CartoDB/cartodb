

  /**
   *  Dialog to name the new visualization
   *  - It don't need any model or specific option
   */

  cdb.admin.NameVisualization = cdb.admin.BaseDialog.extend({

    events: cdb.core.View.extendEvents({
      "keydown input":    "_checkEnter"
    }),

    initialize: function() {
      // Extend options
      _.extend(this.options, {
        title: 'Save your visualization',
        description: 'A visualization is a mix of layers, styles and sql. Your visualizations are now accesible from your dashboard.',
        template_name: 'common/views/dialog_base',
        clean_on_hide: true,
        ok_button_classes: "button green",
        ok_title: "Create visualization",
        modal_type: "creation",
        modal_class: "name_visualization",
        width: 450,
        error_messages: {
          blank: 'The visualization name can\'t be blank'
        }
      });
      this.constructor.__super__.initialize.apply(this);
    },

    render_content: function() {
      var $content = this.$content = $("<div>");
      this.template = cdb.templates.getTemplate('table/views/name_visualization_dialog');
      $content.append(this.template(this.options));

      // Focus in the input
      setTimeout(function() {
        $content.find("input").focus();
      },300);
      return $content;
    },

    _checkEnter: function(e) {
      var code = (e.keyCode ? e.keyCode : e.which);
      if(code == 13) {
        this.killEvent(e);
        this.ok();
      }
    },

    _isValidName: function() {
      var value = this.$content.find('input').val();
      return value.length > 0 && value != " ";
    },

    ok: function(ev) {
      this.killEvent(ev);
      var value = this.$content.find('input').val();

      if (this._isValidName(value)) {
        this.options.res && this.options.res(value);
      }
    }
  });
