
cdb.admin.mod.CartoEditor = cdb.core.View.extend({

    events: {
      'click .apply': 'applyStyle'
    },

    initialize: function() {
      this.template = this.getTemplate('table/menu_modules/views/carto_editor');
      this.model.bind('change:tile_style', this._updateStyle, this);
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
      return this;
    },

    _updateStyle: function(){
      var st = this.model.get('tile_style');
      if(this.codeEditor && st) {
        this.codeEditor.setValue(st);
        this.codeEditor.refresh();
      }
    },

    _parseError: function(err) {
      this.$('.error').html(err.errors.join('<br/>'));
    },

    _clearErrors: function() {
      this.$('.error').html('');
    },

    applyStyle: function() {
      var style = this.codeEditor.getValue();
      //TODO: compile and validate
      this.model.set({ tile_style: style });
      this.model.save();
    }

});
