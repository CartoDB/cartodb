
  /**
   *  Legend HTML editor pane
   *
   */

  cdb.admin.mod.LegendHTMLPane = cdb.core.View.extend({

    _STORAGE_NAMESPACE: "cdb.localStorage.legend.",

    _TEXTS: {
      template_error: _t('Error in line {{line}}: {{msg}}')
    },

    className: "htmlPane",

    events: {
      'click .apply': '_apply'
    },

    initialize: function() {
      _.bindAll(this, '_onKeyUpEditor');

      this.template = this.getTemplate("table/menu_modules/legends/views/legend_html_pane");

      this.render();

      this.model.bind("change:type",  this._setContent,   this);
      this.model.bind("change:items", this._resetContent, this);
      this.model.bind("change:title change:show_title", this._resetContent, this);
    },

    render: function() {
      this.clearSubViews();
      this.$el.html(this.template);

      // Init codemirror editor
      this._initEditor();
      // Init help
      this._initHelp();

      return this;
    },

    _initHelp: function() {
      this.help = new cdb.admin.mod.HTMLEditorHelp({
        text: ' - ',
        localStorageKey: this._STORAGE_NAMESPACE
      }).bind("hide show", this.adjustCodeEditorSize, this);

      this.$el.append(this.help.render().$el);

      this.addView(this.help);
    },

    _initEditor: function() {
      var self = this;

      this.codeEditor = CodeMirror.fromTextArea(this.$('textarea')[0], {
        mode: "text/x-carto",
        tabMode: "indent",
        tabSize: 2,
        matchBrackets: true,
        lineNumbers: true,
        lineWrapping: true,
        onKeyEvent: this._onKeyUpEditor,
        extraKeys: {
          "Ctrl-Space": function(cm) { self._showAutocomplete(cm) }
        }
      });

      // Set user keymap
      this._setKeymap();

      // Set value
      this._setContent();
    },

    _showAutocomplete: function(cm) {
      CodeMirror.showHint(cm, CodeMirror.hint['custom-list'], {
        completeSingle: false,
        list: _.map(this.model.get('items'), function(obj) { return obj.value })
      });
    },

    _onKeyUpEditor: function(cm, e) {
      if (e.type == "keyup") {

        var self = this;

        if (this.autocomplete_timeout) clearTimeout(this.autocomplete_timeout);

        this.autocomplete_timeout = setTimeout(function() {
          var cur = cm.getCursor();
          var str = cm.getTokenAt(cur).string;

          if (str.length > 2) {
            var list = _.compact(_.map(self.model.get('items'), function(obj) {
              if (obj && obj.value)
                return obj.value;
              return null;
            }));

            if (!cm.state.completionActive && str.length > 2 && list.length > 0) {
              self._showAutocomplete(cm)
            }
          }

        }, 150);
      }
    },

    _setKeymap: function() {
      // Codemirror extrakey
      // Add save keymap
      // PC & LINUX -> Ctrl + s
      // MAC        -> Cmd + s
      var ua      = navigator.userAgent.toLowerCase();
      var self    = this;
      this.keymap = {
        so: "rest",
        combination: "ctrl+s"
      }

      if (/mac os/.test(ua)) {
        this.keymap = {
          so: "mac",
          combination: "meta+s"
        }
      }

      this.$('textarea').bind('keydown', this.keymap.combination, function(e) {
        if (((self.keymap.so=="mac" && e.metaKey) || (self.keymap.so=="rest" && e.ctrlKey)) && e.keyCode == 83 ) {
          e.preventDefault();
          self._apply();
        }
      });
    },

    _setContent: function() {
      var html_value = this.model.get("template") || this._getTemplateContent();
      this.codeEditor.setValue(html_value);
      this._clearErrors();
    },

    _resetContent: function() {
      // If custom html is not set
      if (!this.model.get('template')) {
        this._setContent();
      }
    },

    _capitalize: function(string) {
      if (string && _.isString(string)) {
        return string.charAt(0).toUpperCase() + string.slice(1);
      }
      return "";
    },

    _getTemplateContent: function() {

      var type = this.model.get("type");
      var legend_name = this._capitalize(type) + "Legend";

      if (!type || type == "none") return "";

      if (!cdb.geo.ui[legend_name]) return "";

      var view = new cdb.geo.ui[legend_name]({
        model: this.model
        //title: this.model.get("title"),
        //show_title: this.model.get("show_title"),
        //items: this.model.items,
        //template: this.model.get("template")
      });

      return "<div class='cartodb-legend " + this.model.get("type") + "'>\n" + view.render().$el.html() + "\n</div>"

    },

    _toggleContent: function() {},

    _getErrors: function() {
      try {
        var temp = cdb.core.Template.compile(this.codeEditor.getValue(), "mustache")()
        return {};
      } catch (e) {
        return e;
      }
    },

    _parseErrors: function(errors) {
      // Generate and manage error
      var error_text =  "an error"; // Enable this feature if it is needed

      // Add error text
      this.$('.info')
        .addClass('error')
        .html("<p>" + error_text + "</p>")
        .show();

      this.adjustCodeEditorSize();
    },

    _clearErrors: function() {
      // Remove error text and hide it
      this.$('.info')
        .removeClass('error')
        .html('')
        .hide();

      this.adjustCodeEditorSize();
    },

    adjustCodeEditorSize: function() {
      // Fit editor with the error
      var info_h = this.$('.info').is(':visible') ? this.$('.info').outerHeight() : 0;
      var help_h = this.$('.help').is(':visible') ? this.$('.help').outerHeight() : 0;

      this.$('.CodeMirror-wrap').css({
        bottom: info_h + 80, /* the space we need to show the action buttons */
        top: help_h + (-10)
      });
    },

    _onSQLApplied: function() {
      if (this.model.get('template')) {
        this._apply();
      }
    },

    _apply: function(e) {
      if (e && e.preventDefault) e.preventDefault();

      // Prevent setting the template value again
      this.model.unbind("change:template", this._setContent, this);

      // Set all fields + new custom template
      this.model.set({
        template: this.codeEditor.getValue()
      });

      // Binding again the template change in the model :)
      this.model.bind("change:template", this._setContent, this);

      if (!this.model.get("template")) this.model.set("template", this._getTemplateContent())
    },

    clean: function() {
      this.$('textarea').unbind('keydown', null, null);
      cdb.core.View.prototype.clean.call(this);
    }

  });
