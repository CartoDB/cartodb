
  /**
   *  Infowindow HTML editor pane
   *
   */

  cdb.admin.mod.InfowindowHTMLPane = cdb.admin.mod.InfowindowBasePane.extend({

    _DEFAULT_TEMPLATE: "<!--\n\nYou can use the names of your fields:\n\n{{name}}, {{description}}, etc.\n\n-->",

    events: {
      'click .apply':    '_apply',
      'keyup textarea': '_onKeyUp'
    },

    initialize: function() {
      this._setupTemplate();
      this.render();

      this.add_related_model(this.model);
      this.model.bind("change:custom_html", this._onChangeContent, this);
    },

    render: function() {
      this.clearSubViews();
      this.$el.html(this.template);

      var mode = "text";

      if (this.model.get("custom_html")) {
        text = this.model.get("custom_html");
        mode = "text/x-carto";
      }

      this.codeEditor = CodeMirror.fromTextArea(this.$('textarea')[0], {
        mode: mode,
        tabMode: "indent",
        matchBrackets: true,
        lineNumbers: true,
        lineWrapping: true
      })

      this.codeEditor.setValue(this._DEFAULT_TEMPLATE);

      return this;
    },

    _onChangeContent: function() {
      var customHTML = this.model.get("custom_html");

      if (customHTML) {
        this.codeEditor.setOption("mode", "text/x-carto");
        this.codeEditor.setValue(customHTML);
      } else {
        this.codeEditor.setValue(this._DEFAULT_TEMPLATE);
        this.codeEditor.setOption("mode", "text");
      }
    },

    _onKeyUp: function() {
      if (this.codeEditor.getValue().length > 0) {
        this.$el.find(".apply").removeClass("disabled");
        this.codeEditor.setOption("mode", "text/x-carto");
      }
    },

    _setupTemplate: function() {
      this.template = this.getTemplate("table/views/infowindows/infowindow_html_pane");
    },

    _apply: function(e) {
      e.preventDefault();
      e.stopPropagation();

      var html = this.codeEditor.getValue();

      this.model.set("custom_html", html);
    }

  });