
/**
 * menu bar sql module
 * this module is used to perform custom SQL queries on the table (and the map)
 */

cdb.admin.mod = cdb.admin.mod || {};

cdb.admin.mod.SQL = cdb.admin.Module.extend({

    _ACTION: {
      type: 'show',
      width: 600
    },

    buttonClass: 'sql_mod',
    type: 'tool',
    className: "sql_panel",
    
    events: {
      'click .actions a.clearview': '_clearView',
      'click .actions button':      'applyQuery',
      'click .actions a.next':      '_do',
      'click .actions a.back':      '_undo',
      'click .doc_info':            '_showDoc'
    },

    initialize: function() {
      _.bindAll(this, '_onKeyUpEditor');

      var self = this;
      this.template = this.getTemplate('table/menu_modules/views/sql');

      // this.model.bind('change:table_name',      this._replaceSQL,       this); // Not for the moment
      this.model.bind('change:query',           this._updateSQL,        this);
      this.model.bind('change:query_generated', this._updateQueryInfo,  this);
      this.model.bind('errorSQLView',           this._onSQLError,       this);

      // Set query position from history array and last sql applied
      var history = this.model.get('query_history')
        , position = this.model.query_history_position
        , sql =  this.model.get('query') || this._defaultSQL();

      this.model.query_history_position = _.indexOf(history, sql) || 0;
      this.add_related_model(this.model);
    },

    activated: function() {
      if(this.codeEditor) {
        this.codeEditor.refresh();
        this.codeEditor.focus();
        this._adjustCodeEditorSize();
      }
    },

    _defaultSQL: function() {
      return 'SELECT * FROM ' + this.model.get('table_name');
    },

    /**
     *  Replace the old table_name for the new one
     */
    _replaceSQL: function(m, new_table) {
      var old_name = m.previous('table_name')
        , old_query = this.codeEditor.getValue()
        , regex = new RegExp(old_name,'g')
        , new_query = old_query.replace(regex, new_table);

      this.codeEditor.setValue(new_query)
    },

    _onSQLError: function(resp) {
      try {
        var errors = JSON.parse(resp.responseText);
        // sql api returns error and rails api return errors
        // so support both until rails api is removed
        this._parseError(errors.errors || errors.error);
      } catch(exp) {
        this._parseError([_t('unknown error')]);
      }
      this._toggleClearView("error");
    },

    _updateSQL: function() {
      // Send clear error event to clear the error icon if there was any
      this.trigger('clearError');

      if (this.codeEditor) {
        this._clearErrors();

        // Set new query value and refresh the editor
        // if it is different than the editor value
        var query         = this.model.get('query')// || this._defaultSQL()
          , editor_query  = this.codeEditor.getValue();

        // when there is no editor query, set query to default to be changed
        // in the editor
        // if the editor query is set, leave query untouched, this allows
        // update and delete queries be kept after press apply query
        var keepSql = false;
        if(editor_query && (new cdb.admin.CartoDBTableMetadata()).alterTable(editor_query)) {
          keepSql = true;
        }

        if(!keepSql) {
          this.codeEditor.setValue(this.model.get('query') || this._defaultSQL());
          this.codeEditor.refresh();
        }

        // Check buttons
        if (this.model.get('query_history'))
          this._checkDoButtons();
      }

      // Show or not the sql-window "clear view" button
      this._toggleClearView(this.model.get("query"));
    },

    _toggleClearView: function(query) {
      if (!query) {
        this.$el.find("a.clearview").hide();
      } else {
        this.$el.find("a.clearview").show();
      }
    },

    _clearView: function(e) {
      e.preventDefault();
      this.model.clearSQLView();
      return false;
    },

    render: function() {
      var self = this;
      
      this.$el.append(this.template({}));

      this.codeEditor = CodeMirror.fromTextArea(this.$('textarea')[0], {
        mode: "text/x-postgres",
        tabMode: "indent",
        matchBrackets: true,
        lineNumbers: true,
        lineWrapping: true,
        onKeyEvent: this._onKeyUpEditor,
        extraKeys: {
          "Ctrl-Space": function(cm) { self._showAutocomplete(cm) }
        }
      });
      this.$('textarea').bind('keyup', this._checkSubmit.bind(this))
      this._updateSQL();
      this._updateQueryInfo();

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
          self.applyQuery();
        }
      });

      this.$actionButton = this.$('.actions button');

      this._adjustCodeEditorSize();

      return this;
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

    _showAutocomplete: function(cm) {
      CodeMirror.showHint(cm, CodeMirror.hint['custom-list'], {
        completeSingle: false,
        list: this._getSQLColumns()
      });
    },

    _getSQLColumns: function() {
      return _.map(
        _.union(
          this.model.table.get('schema'),
          [['the_geom_webmercator',0]]
        ), function(pair) { return pair[0] });
    },

    _checkSubmit: function(ev) {
      if(ev.shiftKey && ev.keyCode === 13) {
        this.killEvent(ev);
        this.applyQuery();
      }
    },

    _parseError: function(errors) {
      // Add error text
      this.$('.info')
        .addClass('error')
        .html("<p>" + errors.join('<br/>') + "</p>")
        .show();

      // Fit editor with the error
      this._adjustCodeEditorSize();
    },

    _adjustCodeEditorSize: function() {
      // Fit editor with the error
      var h = this.$('.info').is(':visible') ? this.$('.info').outerHeight() : 0;
      this.$('.CodeMirror-wrap').css({bottom: h + 80 /* the space we need to show the action buttons */});
    },

    _updateQueryInfo: function() {
      if(this.model.get('query_generated')) {
        this.$('.info').removeClass('error');
          /*.html('<p>' + _t('This query is wrapped in order to generate the current visualizacion so some queries may not work.') + '</p>')
          .show();*/
      } else {
        this.$('.info').hide();
      }
    },

    _clearErrors: function() {
      // Remove error text and hide it
      this.$('.info')
        .removeClass('error')
        .html('')
        .hide();
      this._adjustCodeEditorSize();
    },

    _do: function(e) {
      e.preventDefault();
      var newQuery = this.model.redoHistory('query');
      if (this.codeEditor && newQuery) {
        this.codeEditor.setValue(newQuery);
        this._checkDoButtons();
      }
      return false;
    },

    _undo: function(e) {
      e.preventDefault();
      var newQuery = this.model.undoHistory('query');
      if (this.codeEditor && newQuery) {
        this.codeEditor.setValue(newQuery);
        this._checkDoButtons();
      }
      return false;
    },

    applyQuery: function() {
      var self = this;
      this._clearErrors();

      var sql = this.codeEditor.getValue();
      // replace {table_name}
      sql = sql.replace(/{table_name}/g, this.model.table.get('name'));

      this.model.applySQLView(sql);

      return false;
    },

    /**
     * Check if the sql has changed from its saved value
     * @return {Boolean}
     */
    hasChanges: function() {
      return this.model.get('query') != this.codeEditor.getValue();
    },

    _checkDoButtons: function() {
      // Redo
      if (!this.model.isHistoryAtLastPosition('query')) {
        this.$el.find('a.next').removeClass("disabled")
      } else {
        this.$el.find('a.next').addClass("disabled")
      }
      // Undo
      if (!this.model.isHistoryAtFirstPosition('query')) {
        this.$el.find('a.back').removeClass("disabled")
      } else {
        this.$el.find('a.back').addClass("disabled")
      }
    },

    _showDoc: function(ev) {
      ev.preventDefault();
      var dialog = new cdb.admin.PostgresInfo();
      $("body").append(dialog.render().el);
      dialog.open();
    }

});
