
cdb.admin.mod.CartoEditor = cdb.core.View.extend({

    events: {
      'click .actions button': 'applyStyle',
      'click .actions a.next': '_do',
      'click .actions a.back': '_undo'
    },

    initialize: function() {
      _.bindAll(this, '_showError')
      this.template = this.getTemplate('table/menu_modules/views/carto_editor');
      this.model.bind('change:tile_style', this._updateStyle, this);

      this.add_related_model(this.model);

      // Set query position from history array and last sql applied
      var history = this.model.get('tile_style_history')
      , position = this.model.tile_style_history_position
      , style =  this.model.get('tile_style');

      this.model.tile_style_history_position = _.indexOf(history, style) || 0;
      this.model.bind('parseError', this._showError, this);
      this.model.bind('tileError', this._renderError, this);
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
        lineWrapping: true//,
        //extraKeys: {"Ctrl-Space": "autocomplete"}
      });
      this._updateStyle();

      // Add tooltip for undo/redo buttons
      this.$el.find("a.next,a.back").tipsy({
        gravity: "s",
        fade: true
      });

      return this;
    },

    _updateStyle: function(){
      var st = this.model.get('tile_style');
      if(this.codeEditor && st) {
        this.codeEditor.setValue(st);
        this.codeEditor.refresh();

        // If model is using history, check buttons
        if (this.model.get('tile_style_history'))
          this._checkDoButtons();
      }
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

      }
    },

    _renderError: function(err) {
      this.trigger('hasErrors');
      this.$('.info').html(err);
      this.$('.info')
        .addClass('error')
        .show();
    },

    _clearErrors: function() {
      this.trigger('clearError');
      this.$('.info').html('').removeClass('error').hide();
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
      var style = this.codeEditor.getValue();
      this._clearErrors();
      //TODO: compile and validate
      this.model.save({ tile_style: style });
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
