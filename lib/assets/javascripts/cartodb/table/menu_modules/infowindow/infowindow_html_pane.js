
  /**
   *  Infowindow HTML editor pane
   *
   */

  cdb.admin.mod.InfowindowHTMLPane = cdb.admin.mod.InfowindowBasePane.extend({

    _DEFAULT_TEMPLATE: "<!--\n Click the interrogation above to know more about templating infowindows in CartoDB. \n-->",
    _TEMPLATE_URL: "table/views/infowindow/custom_templates",

    _TEXTS: {
      template_error: _t('Error in line {{line}}, {{msg}}')
    },

    events: {
      'click .apply': '_apply'
    },

    initialize: function() {
      this._setupTemplate();
      this.render();

      this.model.bind("change:template change:template_name", this._setContent, this);
    },

    render: function() {
      this.clearSubViews();
      this.$el.html(this.template);

      this.codeEditor = CodeMirror.fromTextArea(this.$('textarea')[0], {
        mode: "text/x-carto",
        tabMode: "indent",
        matchBrackets: true,
        lineNumbers: true,
        lineWrapping: true
      })

      // Set value
      this._setContent();

      return this;
    },

    _setContent: function() {
      var html_value = this.model.get("template") || this._getTemplateContent();
      this.codeEditor.setValue(html_value);
      this._clearErrors();
    },

    _getTemplateContent: function() {
      return this._DEFAULT_TEMPLATE + "\n\n" + 
      cdb.templates.getTemplate(this._getTemplateURL())({content: this.model.toJSON() });
    },

    _getTemplateURL: function() {
      // Checking if template_name was a template-url and not
      // an infowindow type
      var template_name = cdb.admin.mod.TemplateMap[this.model.get("template_name")] || this.model.get("template_name");
      return this._TEMPLATE_URL + "/" + template_name;
    },

    _setupTemplate: function() {
      this.template = this.getTemplate("table/views/infowindow/infowindow_html_pane");
    },


    _getErrors: function() {
      try {
        return cdb.core.Template.compile(this.codeEditor.getValue(), "mustache")()
      } catch (e) {
        return e;
      }
    },

    _parseErrors: function(errors) {
      // Generate error
      var error_text = this._TEXTS.template_error
        .replace('{{line}}', errors.line)
        .replace('{{msg}}', errors.message.split('\n\n')[1]);

      // Add error text
      this.$('.info')
        .addClass('error')
        .html("<p>" + error_text + "</p>")
        .show();

      // Fit editor with the error
      var h = this.$('.info').outerHeight();
      this.$('.CodeMirror-wrap').css({bottom: h + 80  /*the space we need to show the action buttons*/ });
    },

    _clearErrors: function() {
      // Remove error text and hide it
      this.$('.info')
        .removeClass('error')
        .html('')
        .hide();

      // Fit again the Coremirror editor
      this.$('.CodeMirror-wrap').css({bottom: 80});
    },

    _apply: function(e) {
      this.killEvent(e);
      var errors = this._getErrors();
      
      if (errors) {
        this._parseErrors(errors);
      } else {
        this._clearErrors(errors);
        this.model.set("template", this.codeEditor.getValue());
      }
    }

  });