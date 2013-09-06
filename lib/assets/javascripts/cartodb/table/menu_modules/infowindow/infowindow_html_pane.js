
  /**
   *  Infowindow HTML editor pane
   *
   */

  cdb.admin.mod.InfowindowHTMLPane = cdb.admin.mod.InfowindowBasePane.extend({

    _DEFAULT_TEMPLATE: "<!--\n Click the question mark above to know more about templating infowindows in CartoDB. \n-->",
    _TEMPLATE_URL: "table/views/infowindow/custom_templates",

    _TEXTS: {
      template_error: _t('Error in line {{line}}: {{msg}}')
    },

    events: {
      'click .apply': '_apply'
    },

    initialize: function() {
      this._setupTemplate();
      this.render();

      this.model.bind("change:template change:template_name change:fields", this._setContent, this);
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
      });

      // Set user keymap
      this._setKeymap();

      // Set value
      this._setContent();

      return this;
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
        var temp = cdb.core.Template.compile(this.codeEditor.getValue(), "mustache")()
        return {};
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
      this.$('.CodeMirror-wrap').css({bottom: h + 80  /* the space we need to show the action buttons */ });
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
      if (e && e.preventDefault) e.preventDefault();
      var errors = this._getErrors();
      
      if (!_.isEmpty(errors)) {
        this._parseErrors(errors);
      } else {
        this._clearErrors();

        // Save old fields
        if (!this.model.get('old_fields')) this.model.saveFields();

        // Prevent setting the template value again
        this.model.unbind("change:template", this._setContent, this);

        // Set all fields + new custom template
        this.model.set({
          template: this.codeEditor.getValue(),
          fields:   this._generateFields()
        });

        // Binding again the template change in the model :)
        this.model.bind("change:template", this._setContent, this);
      }
    },

    _generateFields: function() {
      var columns = this.getColumnNames();
      var fields = [];

      _.each(columns, function(col_name, i) {
        fields.push({ position: i, name: col_name, title: true });
      });

      return fields;
    },

    // column names to be rendered
    getColumnNames: function() {
      var self = this;
      var names = this.options.table.columnNames();
      return _(names).filter(function(c) {
        return !_.contains(self.model.SYSTEM_COLUMNS, c);
      });
    },

    clean: function() {
      this.$('textarea').unbind('keydown', null, null);
      cdb.admin.mod.InfowindowBasePane.prototype.clean.call(this);
    }

  });