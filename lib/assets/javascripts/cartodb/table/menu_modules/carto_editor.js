
cdb.admin.mod.CartoCSSEditor = cdb.core.View.extend({

  events: {
    'click .actions button':  'applyStyle',
    'click .actions a.next':  '_do',
    'click .actions a.back':  '_undo'
  },

  initialize: function() {
    _.bindAll(this, '_showError')
    this.template = this.getTemplate('table/menu_modules/views/carto_editor');

    this.model.bind('change',      this._updateStyle, this);
    // this.model.bind('refresh:tile_style',  this._updateStyle, this);
    this.add_related_model(this.model);

    // Set query position from history array and last sql applied
    var history   = this.model.get('tile_style_history')
      , position  = this.model.tile_style_history_position
      , style     = this.model.get('tile_style');

    // Model doesn't persist last change, let's add in the history
    if (style && style != "" && history && _.indexOf(history, style)==-1) {
      history.push(style);
      this.model.set({ "tile_style_history": history }, { silent:true });
    }

    // Get history position
    this.model.tile_style_history_position =
      _.indexOf(history, style) != -1
      ? _.indexOf(history, style)
      : 0;

    this.model.bind('parseError', this._showError, this);
    this.model.bind('tileError', this._renderError, this);
    this.model.bind('tileOk', this._clearErrors, this);
  },

  activated: function() {
    if(this.codeEditor) {
      this.codeEditor.refresh();
      this.codeEditor.focus();
    }
  },

  render: function() {
    this.$el.append(this.template({}));
    this.codeEditor = CodeMirror.fromTextArea(this.$('textarea')[0], {
      mode: "text/x-carto",
      tabMode: "indent",
      matchBrackets: true,
      lineNumbers: true,
      lineWrapping: true
    });
    this._updateStyle();

    // Add tooltip for undo/redo buttons
    this.$el.find("a.next,a.back").tipsy({
      gravity: "s",
      fade: true
    });

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

    return this;
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
        var g = err.match(/style\.mss:(\d+):(\d+)\s*(.*)/);
        parsedErrors.push({
          line: parseInt(g[1], 10),
          error: g[3]
        });
      }
    }
    // sort by line
    parsedErrors.sort(function(a, b) { return a.line - b.line; });
    parsedErrors = _.uniq(parsedErrors, true, function(a) { return a.line + a.error; });
    return parsedErrors;
  },

  _showError: function(err) {
    var parsedErrors = this._parseError(err);
    if(parsedErrors.length > 0) {
      var errors = _(parsedErrors).map(function(e) {
        return "line " + e.line + ": " + e.error;
      })
      this._renderError(errors.join('\n'));
    }
  },

  _renderError: function(err) {
    this.trigger('hasErrors');

    // Show the error, positionate it
    this.$('.info')
      .html("<p>" + err + "</p>")
      .addClass('error')
      .show();

    // Adjust Codemirror editor
    var info_height = this.$('.info').outerHeight();
    this.$el.find(".CodeMirror-wrap")
      .css({ bottom: info_height + 88 /* it has some bottom due to the action bottoms */})
  },

  _clearErrors: function() {
    this.trigger('clearError');

    // Hide info
    this.$('.info')
      .html('')
      .removeClass('error')
      .hide();

    // Adjust again the editor
    this.$el.find(".CodeMirror-wrap")
      .css({ bottom: 88 })
  },

  _do: function(e) {
    e.preventDefault();
    this.model.redoStyle();
    return false;
  },

  _undo: function(e) {
    e.preventDefault();
    this.model.undoStyle();
    return false;
  },

  applyStyle: function() {
    this._clearErrors();

    var style = this.codeEditor.getValue();
    //TODO: compile and validate
    this.model.save({ tile_style: style });
    // we save the new applied query on the history array
    this.model.addToHistory('tile_style', sql);

  },

  /**
   * Check if the editor is different from the saved value
   * @return {Boolean}
   */
  hasChanges: function() {
    return this.model.get('tile_style') != this.codeEditor.getValue();
  },

  _checkDoButtons: function() {
    var history = this.model.get('tile_style_history')
      , position = this.model.tile_style_history_position;

    // Redo
    if ((history[position + 1]) != null) {
      this.$el.find('a.next').removeClass("disabled")
    } else {
      this.$el.find('a.next').addClass("disabled")
    }

    // Undo
    if ((history[position - 1]) != null) {
      this.$el.find('a.back').removeClass("disabled")
    } else {
      this.$el.find('a.back').addClass("disabled")
    }
  }
});
