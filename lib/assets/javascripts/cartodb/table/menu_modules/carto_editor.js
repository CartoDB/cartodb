
cdb.admin.mod = cdb.admin.mod || {};
cdb.admin.mod.CartoCSSEditor = cdb.admin.Module.extend({

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
    'click .doc_info':    '_showDoc'
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
      : 0;

    this.model.bind('parseError', this._showErrorFromServer, this);
    /*
    this.model.bind('tileError', this._renderError, this);
    */
    this.model.bind('tileOk', this._checkLocalErrors, this);
    this.model.table.bind('change:schema', this._checkLocalErrors, this);

    //this.buildAutocomplete();
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
    }
  },

  render: function() {
    var self = this;

    this.$el.append(this.template({}));
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
    this._updateStyle();

    // Add tooltip for undo/redo buttons
    this.$el.find("a.next,a.back").tipsy({
      gravity: "s",
      fade: true
    });

    //TODO: move this to common/hotkeys.js
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
      if (((so === "mac" && ev.metaKey) || (so === "rest" && ev.ctrlKey)) && ev.keyCode == 83 ) {
        ev.preventDefault();
        self.applyStyle();
      }
    });

    return this;
  },


  _showAutocomplete: function(cm) {
    CodeMirror.showHint(cm, CodeMirror.hint['custom-list'], {
      completeSingle: false,
      list: _.map(this.model.table.get('schema'), function(pair) { return pair[0]; })
      //list: this.autocomplete
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
          var list = _.compact(_.map(self.model.table.get('schema'), function(pair) {
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
      , editor_st = this.codeEditor.getValue();


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
      if(err && err.length > 0) {
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

  _renderError: function(err) {
    this.trigger('hasErrors');

    // Show the error, positionate it
    this.$('.info')
      .html("<p>" + err + "</p>")
      .addClass('error')
      .show();

    this._adjustCodeEditorSize();
  },

  _adjustCodeEditorSize: function() {
    var h = this.$('.info').is(':visible') ? this.$('.info').outerHeight() : 0;
    this.$('.CodeMirror-wrap').css({bottom: h + 80 /* the space we need to show the action buttons */});
  },

  _checkLocalErrors: function() {
    var style = this.model.get('tile_style');
    var cartoParser = new cdb.admin.CartoParser(style);
    if(cartoParser.errors().length) {
      this._showError(cartoParser.errors())
    } else {
      // check variables used
      var err = this.checkVariables(cartoParser.variablesUsed());
      if(err.length) {
        this._showError(err)
        return;
      }
    }
    if(style && style.indexOf(this.model.get('table_name')) == -1) {
      this._renderError("style name should be #" + this.model.get('table_name') + " otherwise all tiles will be blank");
    } else {
      this._clearErrors();
    }
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
      this._showError(cartoParser.errors())
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

    // Send mixpanel event applying a new cartocss style
    cdb.god.trigger('mixpanel', "Applying a CartoCSS style manually", { style: style });
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
    var dialog = new cdb.admin.CartoCSSInfo();
    $("body").append(dialog.render().el);
    dialog.open();
  }
});
