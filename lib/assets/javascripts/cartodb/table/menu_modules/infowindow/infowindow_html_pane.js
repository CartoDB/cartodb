
  /**
   *  Infowindow HTML editor pane
   *
   */

  cdb.admin.mod.InfowindowHTMLPane = cdb.admin.mod.InfowindowBasePane.extend({

    _DEFAULT_TEMPLATE: "<!--\nYou can use the names of your fields:\n{{name}}, {{description}}, etc.\n-->",
    _TEMPLATE_URL: "table/views/infowindow/custom_templates",

    events: {
      'click .apply':    '_apply',
      'keyup textarea': '_onKeyUp'
    },

    initialize: function() {
      this._setupTemplate();
      this.render();

      this.model.bind("change:custom_html change:template_name", this._setContent, this);
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
      var html_value = this.model.get("custom_html") || this._getTemplateContent();
      this.codeEditor.setValue(html_value);
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

    _onKeyUp: function() {
      if (this.codeEditor.getValue().length > 0) {
        this.$el.find(".apply").removeClass("disabled");
      }
    },

    _setupTemplate: function() {
      this.template = this.getTemplate("table/views/infowindow/infowindow_html_pane");
    },

    _apply: function(e) {
      e.preventDefault();
      e.stopPropagation();

      var html = this.codeEditor.getValue();

      this.model.set("custom_html", html);
    }

  });