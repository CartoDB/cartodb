
cdb.admin.mod.CartoEditor = cdb.core.View.extend({

    events: {
      'click .actions button': 'applyStyle',
      'click .actions a.next': '_do',
      'click .actions a.back': '_undo'
    },

    initialize: function() {
      this.template = this.getTemplate('table/menu_modules/views/carto_editor');
      this.model.bind('change:tile_style', this._updateStyle, this);

      // Set query position from history array and last sql applied
      var history = this.model.get('tile_style_history')
      , position = this.model.tile_style_history_position
      , style =  this.model.get('tile_style');

      this.model.tile_style_history_position = _.indexOf(history, style) || 0;  
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

    _parseError: function(err) {
      this.$('.error').html(err.errors.join('<br/>'));
    },

    _clearErrors: function() {
      this.$('.error').html('');
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
