
/**
 * menu bar sql module
 * this module is used to perform custom SQL queries on the table (and the map)
 */

cdb.admin.mod = cdb.admin.mod || {};

cdb.admin.mod.SQL = cdb.core.View.extend({

    buttonClass: 'sql_mod',
    type: 'tool',
    className: "sql_panel",

    events: {
      'click button': 'applyQuery',
      'click .actions a.next': '_do',
      'click .actions a.back': '_undo'
    },

    initialize: function() {
      var self = this;
      this.template = this.getTemplate('table/menu_modules/views/sql');
      this.sqlView = this.options.sqlView;
      this.model.bind('change:query', this._updateSQL, this);
      this.sqlView.bind('error', function(e, resp) {
          try {
            var errors = JSON.parse(resp.responseText);
            self._parseError(errors.errors);
          } catch(e) {
            self._parseError([_t('unknown error')]);
          }
      });
    },

    activated: function() {
      if(this.codeEditor) {
        this.codeEditor.refresh();
        this.codeEditor.focus();
      }
    },

    _updateSQL: function() {
       if(this.codeEditor) {
        this.codeEditor.setValue(this.model.get('query') || '');
        this.codeEditor.refresh();
       }
    },

    render: function() {
      this.$el.append(this.template({}));

      /*CodeMirror.commands.autocomplete = function(cm) {
        CodeMirror.simpleHint(cm, CodeMirror.postgresHint);
      };*/

      this.codeEditor = CodeMirror.fromTextArea(this.$('textarea')[0], {
        mode: "text/x-postgres",
        tabMode: "indent",
        matchBrackets: true,
        lineNumbers: true,
        lineWrapping: true//
        //extraKeys: {"Ctrl-Space": "autocomplete"}
      });

      this._updateSQL();

      // this.$(".panel_content.nano").nanoScroller({
      //   alwaysVisible: true,
      //   flash: true
      // }).bind("scrollend scroll scrolltop enabled disabled", function(e){
      //   var $nano = $(e.currentTarget);

      //   $nano.addClass(e.type);

      //   if (e.type == "enabled") {
      //     $nano.removeClass("disabled");
      //   } else if (e.type == "disabled") {
      //     $nano.removeClass("enabled");
      //   }

      //   if (e.type == "scrolltop") {
      //     $nano.removeClass("scrollend");
      //   } else if (e.type == "scrollend") {
      //     $nano.removeClass("scrolltop");
      //   }
      // });

      return this;
    },

    _parseError: function(errors) {
      // Add error text
      this.$('.error')
        .html(errors.join('<br/>'))
        .show();

      // Fit editor with the error
      var h = this.$('.error').outerHeight();
      this.$('.CodeMirror').css({bottom: '+=' + h + 'px'});
    },

    _clearErrors: function() {
      // Remove error text and hide it
      this.$('.error')
        .html('')
        .hide();

      // Fit editor with text

    },

    _do: function(e) {
      e.preventDefault();
      this.model.redoQuery();
      return false;
    },

    _undo: function(e) {
      e.preventDefault();
      this.model.undoQuery();
      return false;
    },

    applyQuery: function() {
      var self = this;
      this._clearErrors();
      var sql = this.codeEditor.getValue();
      this.model.save({ query: sql });
    }

});
