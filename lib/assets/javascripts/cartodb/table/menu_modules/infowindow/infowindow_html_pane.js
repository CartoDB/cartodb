
  /**
   *  Infowindow HTML editor pane
   *
   */

  cdb.admin.mod.InfowindowHTMLPane = cdb.admin.mod.InfowindowBasePane.extend({

    _DEFAULT_TEMPLATE: "<!--\nYou can use the names of your fields:\n{{name}}, {{description}}, etc.\n-->",

    events: {
      'click .apply':    '_apply',
      'keyup textarea': '_onKeyUp'
    },

    initialize: function() {
      this._setupTemplate();
      this.render();

      this.model.bind("change:custom_html", this._setContent, this);
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
      var html_value = this.model.get("custom_html") || this._DEFAULT_TEMPLATE;
      this.codeEditor.setValue(html_value);
    },

    _onKeyUp: function() {
      if (this.codeEditor.getValue().length > 0) {
        this.$el.find(".apply").removeClass("disabled");
        this.codeEditor.setOption("mode", "text/x-carto");
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