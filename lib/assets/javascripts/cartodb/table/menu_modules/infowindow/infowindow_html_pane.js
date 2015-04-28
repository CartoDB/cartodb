
  /**
   *  Infowindow HTML editor pane
   *
   */

  cdb.admin.mod.InfowindowHTMLPane = cdb.admin.mod.InfowindowBasePane.extend({

    _TEMPLATE_URL: "table/views/infowindow/custom_templates",
    _STORAGE_NAMESPACE: "cdb.localStorage.infowindow.",

    _TEXTS: {
      tip:            _t('To link data write your column names within {{}}. \
                          &lt;script&gt; tags could break your map.'),
      template_error: _t('Error in line {{line}}: {{msg}}'),
      empty_error:    _t('Template can\'t be empty')
    },

    className: "htmlPane",

    events: {
      'click .apply': '_apply'
    },

    initialize: function(opts) {
      _.bindAll(this, '_onKeyUpEditor');

      if (opts.template_url) {
        this._TEMPLATE_URL = opts.template_url;
      }

      this._setupTemplate();
      this.render();

      this.model.bind("change:width",                           this._checkTemplate,  this);
      this.model.bind("change:template_name",                   this._setContent,     this);
      this.model.bind("change:fields change:alternative_names", this._resetContent,   this);
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
        localStorageKey: this._STORAGE_NAMESPACE + this.options.table.get('id'),
        text: this._TEXTS.tip
      }).bind("hide show", this.adjustCodeEditorSize, this);
      this.$el.append(this.help.render().$el);

      this.addView(this.help);
    },

    _initEditor: function() {
      var self = this;

      this.codeEditor = CodeMirror.fromTextArea(this.$('textarea')[0], {
        mode: "text/xml",
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
        list: _.map(this.options.table.get('schema'), function(pair) { return pair[0] })
      });
    },

    _onKeyUpEditor: function(cm, e) {
      var code = (e.keyCode ? e.keyCode : e.which);
      
      if (e.type == "keyup" && code != 27 ) {
        var self = this;

        if (this.autocomplete_timeout) clearTimeout(this.autocomplete_timeout);

        this.autocomplete_timeout = setTimeout(function() {
          var cur = cm.getCursor();
          var str = cm.getTokenAt(cur).string;

          if (str.length > 2) {
            var list = _.compact(_.map(self.options.table.get('schema'), function(pair) {
              if (pair[0].search(str) != -1)
                return pair[0];
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

    _toggleContent: function() {},

    // Check if custom infowindow html has or not
    // v2 class applied. We need to avoid style problems.
    _checkTemplate: function() {
      // Get content
      var html = this.codeEditor.getValue();
      var exp = /(?=<[^>]+(?=[\s+\"\']cartodb-popup[\s+\"\']).+)([^>]+>)/;

      // If so, add v2 if it is not defined
      if (html.match(exp) && html.match(exp).length > 0) {
        var hasV2Class = $(html).hasClass('v2');

        if (!hasV2Class) {
          var matches = html.match(exp);

          if (matches.length === 0) { return false }

          var occ = matches[0];
          var change = occ.replace('cartodb-popup', 'cartodb-popup v2');

          this.codeEditor.setValue(html.replace(occ,change));
          this._apply();
        }
      }
    },

    _setContent: function() {
      var html_value = this.model.get("template") || this._getTemplateContent();
      this.codeEditor.setValue(html_value);
      this._clearErrors();
    },

    _resetContent: function() {
      // If custom html is not set
      if (this.model.get('template_name')) {
        this._setContent();
      }
    },

    _getTemplateContent: function() {
      // Clone fields
      var fields = [];
      var self = this;
      var alternative_names = _.clone(self.model.get('alternative_names'));

      _.each(this.model.toJSON().fields, function(field, i) {
        var f = _.clone(field);
        f.position = i;
        if (alternative_names[f.name]) {
          f.alternative_name = alternative_names[f.name];
        }
        fields.push(f);
      });

      return cdb.templates.getTemplate(this._getTemplateURL())({content: { fields: fields } });
    },

    _getTemplateURL: function() {
      // Checking if template_name was a template-url and not
      // an infowindow type
      var template_name = cdb.admin.mod.TemplateMap[this.model.get("template_name")] || this.model.get("template_name") || this._DEFAULT_TEMPLATE;
      return this._TEMPLATE_URL + "/" + template_name;
    },

    _setupTemplate: function() {
      this.template = this.getTemplate("table/views/infowindow/infowindow_html_pane");
    },

    _getErrors: function() {
      try {
        var value = this.codeEditor.getValue();
        var temp = cdb.core.Template.compile(this.codeEditor.getValue(), "mustache")()
        if (value === "") {
          return {
            line:     '1',
            message:  '\n\n' + this._TEXTS.empty_error
          }
        } else {
          return {};  
        }
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
      var help_h = this.$('.help-tip').is(':visible') ? this.$('.help-tip').outerHeight() : 0;

      this.$('.CodeMirror-wrap').css({
        bottom: info_h + 80, /* the space we need to show the action buttons */
        top: help_h + (-10)
      });
    },

    _onSQLApplied: function() {
      if (this.model.get('template') && !this.model.get('template_name')) {
        this._apply();
      }
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

        // Save old template name
        if (!this.model.get('old_template_name')) this.model.set('old_template_name', this.model.get('template_name'));

        // Prevent setting the template value again
        this.model.unbind("change:template", this._setContent, this);

        // Set all fields + new custom template
        this.model.set({
          template:       this.codeEditor.getValue(),
          fields:         this._generateFields(),
          template_name:  ''
        });

        // Binding again the template change in the model :)
        this.model.bind("change:template", this._setContent, this);
      }
    },

    _generateFields: function() {
      var self = this;
      var columns = this.getColumnNames();
      var fields = [];

      _.each(columns, function(column, i) {
        fields.push({ position: self.model.getFieldPos(column), name: column, title: true });
      });

      return fields;
    },

    clean: function() {
      this.$('textarea').unbind('keydown', null, null);
      cdb.admin.mod.InfowindowBasePane.prototype.clean.call(this);
    }

  });
