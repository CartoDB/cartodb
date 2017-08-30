
  /**
   *  Carto CSS editor module
   *
   *  new cdb.admin.mod.CartoCSSEditor({
   *    model: dataLayer
   *    table: table
   *  })
   *
   */


cdb.admin.mod = cdb.admin.mod || {};
cdb.admin.mod.CartoCSSEditor = cdb.admin.Module.extend({

  _TEXTS: {
    tip: '<strong>Ctrl + SPACE</strong> to autocomplete. <strong><%- key %> + S</strong> to apply your styles.'
  },

  _ACTION: {
    type: 'show',
    width: 600
  },

  buttonClass: 'cartocss_mod',
  type: 'tool',

  events: {
    'click .actions button':  'applyStyle',
    'click .actions a.next':  '_do',
    'click .actions a.back':  '_undo',
    'click .doc_info':        '_showDoc'
  },

  initialize: function() {
    _.bindAll(this, '_onKeyUpEditor');

    this.template = this.getTemplate('table/menu_modules/views/carto_editor');

    this.model.bind('change',      this._updateStyle, this);
    this.add_related_model(this.model);
    this.add_related_model(this.model.table);

    // Set query position from history array and last sql applied
    var history   = this.model.get('tile_style_history')
      , position  = this.model.tile_style_history_position
      , style     = this.model.get('tile_style');

    // Model doesn't persist last change, let's add in the history
    if (style && style != "" && history && _.indexOf(history, style) === -1) {
      history.push(style);
      this.model.set({ "tile_style_history": history }, { silent:true });
    }

    // Get history position
    this.model.tile_style_history_position =
      _.indexOf(history, style) !== -1
      ? _.indexOf(history, style)
      : 0;

    this.model.bind('parseError', this._showErrorFromServer, this);
    /*
    this.model.bind('tileError', this._renderError, this);
    */
    this.model.bind('tileOk', this._checkLocalErrors, this);
    this.model.table.bind('change:schema', this._checkLocalErrors, this);

    //this.buildAutocomplete();
    this._initBinds();

    cdb.god.bind('end_show', this.activated, this)
    this.add_related_model(cdb.god);
  },

  /** builds autocomplete from cartcss reference */
  buildAutocomplete: function() {
    this.autocomplete = [];
    if (typeof(window._mapnik_reference_latest) !== 'undefined') {
      var symbolizers = _mapnik_reference_latest.symbolizers;
      for (var s in symbolizers) {
        var sym = symbolizers[s];
        for (var p in sym) {
          var css = sym[p].css;
          if (css && css.length) {
            this.autocomplete.push(css);
          }
        }
      }
    }
  },

  activated: function() {
    if(this.codeEditor) {
      this.codeEditor.refresh();
      this.codeEditor.focus();
      this._adjustCodeEditorSize();
    }
  },

  render: function() {
    var self = this;
    this.clearSubViews();

    this.$el.append(this.template({}));

    this._initHelp();
    this._initEditor();

    this._updateStyle();
    this._adjustCodeEditorSize();

    return this;
  },

  _initBinds: function() {
    // Codemirror extrakey
    // Add save keymap
    // PC & LINUX -> Ctrl + s
    // MAC        -> Cmd + s
    var ua      = navigator.userAgent.toLowerCase()
      , so      = "rest"
      , keymap  = "ctrl+s"
      , self    = this;

    if (/mac os/.test(ua)) {
      keymap = "meta+s";
      so = "mac";
    }

    this.$el.bind('keydown', keymap, function(ev) {
      if (((so=="mac" && ev.metaKey) || (so=="rest" && ev.ctrlKey)) && ev.keyCode == 83 ) {
        ev.preventDefault();
        self.applyStyle();
      }
    });
  },

  _initEditor: function() {
    var self = this;
    this.codeEditor = CodeMirror.fromTextArea(this.$('textarea')[0], {
      mode: "text/x-carto",
      tabMode: "indent",
      matchBrackets: true,
      lineNumbers: true,
      lineWrapping: true,
      onKeyEvent: this._onKeyUpEditor,
      extraKeys: {
        "Ctrl-Space": function(cm) { self._showAutocomplete(cm) }
      }
    });

    var color_picker = new cdb.admin.CodemirrorColorPicker({
      editor: this.codeEditor,
      model:  this.model
    });
    color_picker.bind('colorChosen', this.applyStyle, this);
    this.addView(color_picker);

    // Add tooltip for undo/redo buttons
    this.$("a.next, a.back").tipsy({
      gravity: "s",
      fade: true
    });
  },

  _initHelp: function() {
    var so = "rest";
    var ua = navigator.userAgent.toLowerCase();

    if (/mac os/.test(ua)) {
      so = "mac";
    }

    var help = new cdb.admin.mod.HTMLEditorHelp({
      localStorageKey: this._STORAGE_NAMESPACE + this.model.table.get('id'),
      text: _.template(this._TEXTS.tip)({ key: (so == "mac") ? "CMD" : "Ctrl" })
    }).bind("hide show", this._adjustCodeEditorSize, this);
    this.$el.append(help.render().$el);
    this.addView(help);
  },


  _showAutocomplete: function(cm) {
    CodeMirror.showHint(cm, CodeMirror.hint['custom-list-with-type'], {
      completeSingle: false,
      list: _.union( this._getTableName(), this._getSQLColumns())
    });
  },

  _getTableName: function() {
    return [ [ this.model.table.get('name'), "T" ] ]
  },

  _getSQLColumns: function() {
    return _.map(
      this.model.table.get('schema'),
      function(pair) {
        // Column name and type
        return [pair[0], "C"]
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
        var schema = self.model.table.get('schema');

        if (schema && str.length > 2) {
          var arr = _.union(self.model.table.get('schema'), self._getTableName());
          var list = _.compact(_.map(arr, function(pair) {
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

  /** hack used to format the old styles transformed to cartodb 2.0*/
  formatStyle: function(s) {
    try {
      if (s && s.length) {
        s = s.replace(/{/g,'{\n')
            .replace(/}/g,'}\n')
            .replace(/;/g,';\n')
        var t = s.split('\n');
        var lines = [];
        var c = 0;
        for(var i = 0; i < t.length; ++i) {
          lines.push(c);
          if (t[i].indexOf('{')  != -1) {
            ++c;
          }
          if (t[i].indexOf('}')  != -1) {
            --c;
          }
        }
        var r = [];
        for(var i = 0; i < t.length; ++i) {
          var spaces = '';
          if(t[i].indexOf('}') >= 0) lines[i]-=1;
          for(var j = 0; j < lines[i]; ++j) {
            spaces = spaces + '  ';
          }
          r.push(spaces + t[i]);
        }
        return '/** this cartoCSS has been processed in order to be compatible with the new cartodb 2.0 */\n\n' + r.join('\n');
      }
    } catch(e) {
    }
    return s;
  },

  _updateStyle: function(){
    var st        = this.model.get('tile_style')
      , editor_st = this.codeEditor ? this.codeEditor.getValue() : null;


      if(this.codeEditor && st && st != editor_st) {
        if(st.indexOf('\n') === -1) {
          st = this.formatStyle(st);
        }
        this.codeEditor.setValue(st);
        this.codeEditor.refresh();
      }

    // If model is using history, check buttons
    if (this.model.get('tile_style_history'))
      this._checkDoButtons();
  },

  /**
   * gets an array of parse errors from windshaft
   * and returns an array of {line:1, error: 'string'] with user friendly
   * strings. Parses errors in format:
   *
   *  'style.mss:7:2 Invalid code: asdasdasda'
   */
  _parseError: function(errors) {
    var parsedErrors = [];
    for(var i in errors) {
      var err = errors[i];
      if(err) {
        if (err.length > 0) {
          var g = err.match(/.*:(\d+):(\d+)\s*(.*)/);
          if(g) {
            parsedErrors.push({
              line: parseInt(g[1], 10),
              message: g[3]
            });
          } else {
            parsedErrors.push({
              line: null,
              message: err
            })
          }
        } else if(err.line) {
          parsedErrors.push(err);
        }
      }
    }
    // sort by line
    parsedErrors.sort(function(a, b) { return a.line - b.line; });
    parsedErrors = _.uniq(parsedErrors, true, function(a) { return a.line + a.message; });
    return parsedErrors;
  },

  _showErrorFromServer: function(err) {
    this._showError(this._parseError(err));
  },

  _showError: function(err) {
    var parsedErrors = err;
    if(parsedErrors.length > 0) {
      var errors = _(parsedErrors).map(function(e) {
        if(e.line) {
          return "line " + e.line + ": " + e.message;
        }
        return e.error || e.message;
      })
      this._renderError(errors.join('</br>'));
    }
  },

  _renderError: function(errors) {
    this.trigger('hasErrors');

    // Get actions block height
    var actions_h = this.$('.actions').outerHeight();

    // Add error text
    this.$('.info')
      .addClass('error')
      .html("<p>" + errors + "</p>")
      // If layer is not visible, we need to move error message
      .css({
        bottom: actions_h + (!this.model.get('visible') ? 57 : 0)
      })
      .show();

    this._adjustCodeEditorSize();
  },

  _adjustCodeEditorSize: function() {
    // Fit editor with the error
    var info_h = this.$('.info').is(':visible') ? this.$('.info').outerHeight() : 0;
    var help_h = this.$('.help-tip').is(':visible') ? 36 : 0 ;
    // If layer is not visible, we need to take into account
    var vis_msg_h = !this.model.get('visible') ? 57 : 0 ;

    this.$('.CodeMirror-wrap').css({
      bottom: info_h + vis_msg_h + 80, /* the space we need to show the action buttons */
      top: help_h
    });
  },

  _checkLocalErrors: function() {
    var style = this.model.get('tile_style');
    var cartoParser = new cdb.admin.CartoParser(style);
    if(cartoParser.errors().length) {
      this._showError(this._parseError(cartoParser.errors()));
    } else {
      // check variables used
      var err = this.checkVariables(cartoParser.variablesUsed());
      if(err.length) {
        this._showError(err);
        return;
      }
    }
    this._clearErrors();
  },

  _clearErrors: function() {
    this.trigger('clearError');

    // Hide info
    this.$('.info')
      .html('')
      .removeClass('error')
      .hide();

    this._adjustCodeEditorSize();
  },

  _do: function(e) {
    e.preventDefault();
    var newCarto = this.model.redoHistory('tile_style');
    if(this.codeEditor) this.codeEditor.setValue(newCarto);
    this._checkDoButtons();
    return false;
  },

  _undo: function(e) {
    e.preventDefault();
    var newCarto = this.model.undoHistory('tile_style');
    if(this.codeEditor) this.codeEditor.setValue(newCarto);
    this._checkDoButtons();
    return false;
  },

  /**
   * checks variabels used in cartocss are in the schem
   */
  checkVariables: function(vars) {
    var columns = this.model.table.columnNames();
    var err = [];
    for(var i in vars) {
      if(!_.contains(columns, vars[i])) {
        err.push({
          error: "sql/table must contain " + vars[i] + " variable"
        });
      }
    }
    return err;
  },

  applyStyle: function() {
    this._clearErrors();
    var style = this.codeEditor.getValue();
    var cartoParser = new cdb.admin.CartoParser(style);
    if(cartoParser.errors().length) {
      var errors = this._parseError(cartoParser.errors());
      if(errors) this._showError(errors);
    } else {
      // check variables used
      var err = this.checkVariables(cartoParser.variablesUsed());
      if(err.length) {
        this._showError(err)
        return;
      }
      this.model.addToHistory('tile_style', style);
      //TODO: check if the style has been changed
      this.model.save({
        tile_style: style,
        tile_style_custom: true
      });

      // we save the new applied query on the history array
      this.trigger('applyStyle', style);
    }

    // Event tracking "Applied CartoCSS style manually"
    cdb.god.trigger('metrics', 'cartocss_manually', {
      email: window.user_data.email
    });
  },

  /**
   * Check if the editor is different from the saved value
   * @return {Boolean}
   */
  hasChanges: function() {
    return this.model.get('tile_style') != this.codeEditor.getValue();
  },

  _checkDoButtons: function() {
      // Redo
      if (!this.model.isHistoryAtLastPosition('tile_style')) {
        this.$el.find('a.next').removeClass("disabled")
      } else {
        this.$el.find('a.next').addClass("disabled")
      }
      // Undo
      if (!this.model.isHistoryAtFirstPosition('tile_style')) {
        this.$el.find('a.back').removeClass("disabled")
      } else {
        this.$el.find('a.back').addClass("disabled")
      }
  },

  _showDoc: function(ev) {
    ev.preventDefault();
    cdb.editor.ViewFactory.createDialogByTemplate('common/dialogs/help/carto_css').appendToBody();
  }
});
