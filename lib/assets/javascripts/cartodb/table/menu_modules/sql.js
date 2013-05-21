
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
      'click .actions a.clearview': '_clearView',
      'click .actions button':      'applyQuery',
      'click .actions a.next':      '_do',
      'click .actions a.back':      '_undo',
      'click .doc_info':            '_showDoc'
    },

    initialize: function() {
      var self = this;
      this.template = this.getTemplate('table/menu_modules/views/sql');
      this.sqlView = this.options.sqlView;

      // this.model.bind('change:table_name',      this._replaceSQL,       this); // Not for the moment
      this.model.bind('change:query',           this._updateSQL,        this);
      this.model.bind('change:query_generated', this._updateQueryInfo,  this);
      
      this.sqlView.bind('error', function(e, resp) {
        try {
          var errors = JSON.parse(resp.responseText);
          self._parseError(errors.errors);
        } catch(exp) {
          self._parseError([_t('unknown error')]);
        }
      });

      // Set query position from history array and last sql applied
      var history = this.model.get('query_history')
        , position = this.model.query_history_position
        , sql =  this.model.get('query') || this._defaultSQL();

      this.model.query_history_position = _.indexOf(history, sql) || 0;
    },

    activated: function() {
      if(this.codeEditor) {
        this.codeEditor.refresh();
        this.codeEditor.focus();
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

    _updateSQL: function() {
      // Send clear error event to clear the error icon if there was any
      this.trigger('clearError');

      if (this.codeEditor) {
        this._clearErrors();

        // Set new query value and refresh the editor
        // if it is different than the editor value
        var query         = this.model.get('query') || this._defaultSQL()
          , editor_query  = this.codeEditor.getValue();

        if (query != editor_query) {
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

      this.model.save({ query: undefined });
      this.model.addToHistory("query", "SELECT * FROM " + this.options.table.get('name'));
      this.options.table.useSQLView(null);

      this.trigger('clearSQLView');
      
      return false;
    },

    render: function() {
      this.$el.append(this.template({}));

      this.codeEditor = CodeMirror.fromTextArea(this.$('textarea')[0], {
        mode: "text/x-postgres",
        tabMode: "indent",
        matchBrackets: true,
        lineNumbers: true,
        lineWrapping: true//
        //extraKeys: {"Ctrl-Space": "autocomplete"}
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

      return this;
    },

    _checkSubmit: function(ev) {
      if(ev.shiftKey && ev.keyCode === 13) {
        this.killEvent(ev);
        this.applyQuery();
      }
      // this would allow to activate & deativate apply button when applicableState = true
      //  else {
      //   if(this.hasChanges()) {
      //     this.$actionButton.removeClass('disabled');
      //   } else {
      //     this.$actionButton.addClass('disabled');
      //   }
      // }
    },

    _parseError: function(errors) {
      // Trigger error
      this.trigger('hasErrors');

      // Add error text
      this.$('.info')
        .addClass('error')
        .html("<p>" + errors.join('<br/>') + "</p>")
        .show();

      // Fit editor with the error
      var h = this.$('.info').outerHeight();
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

      // Fit again the Coremirror editor
      this.$('.CodeMirror-wrap').css({bottom: 80});
    },

    _do: function(e) {
      e.preventDefault();
      var newQuery = this.model.redoHistory('query');
      if(this.codeEditor) this.codeEditor.setValue(newQuery);
      this._checkDoButtons();
      return false;
    },

    _undo: function(e) {
      e.preventDefault();
      var newQuery = this.model.undoHistory('query');
      if(this.codeEditor) this.codeEditor.setValue(newQuery);
      this._checkDoButtons();
      return false;
    },

    applyQuery: function() {
      var self = this;
      this._clearErrors();

      var sql = this.codeEditor.getValue();

      // if the sql change the table data do not save in the data layer
      // pass though and launch the query directly to the table
      this.options.table.useSQLView(this.options.sqlView);
      this.options.sqlView.setSQL(sql, { silent: true });
      this.model.addToHistory("query", sql);
      // if there is some error the query is rollbacked
      this.sqlView.fetch();

      this.trigger('applyQuery', sql);
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
