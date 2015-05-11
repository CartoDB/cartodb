
  /**
   *  Show all private tables that belongs to the visualization
   *  - You can make them public here and then show the share dialog.
   *
   *  var share_privacy = new cdb.admin.SharePrivateTablesDialog({
   *    model: visualization_model
   *  });
   */

  cdb.admin.SharePrivateTablesDialog = cdb.admin.BaseDialog.extend({

    _TEXTS: {
      title:    _t('Cannot make this visualization public'),
      ok_close: _t('Ok, close'),
      ok_next:  _t('Share now!')
    },

    initialize: function() {
      this.options = _.extend({
        title: this._TEXTS.title,
        template_name: 'old_common/views/dialog_base',
        clean_on_hide: true,
        enter_to_confirm: true,
        ok_button_classes: "button grey",
        ok_title: this._TEXTS.ok_close,
        cancel_button_classes: "hide",
        modal_type: "confirmation",
        width: 510,
        modal_class: 'share_private_tables_dialog'
      }, this.options);


      this.active = !this._anyPrivateTable();
      this.elder('initialize');
    },

    render_content: function() {

      var $content = $("<div>").append(this.getTemplate('old_common/views/share_private_tables_dialog')(this.model.toJSON()));
      var self = this;
      
      // Render private tables
      if (this.model.related_tables) {
        this.model.related_tables.each(function(table) {
          if (table.get('privacy') && table.get('privacy').toLowerCase() == "private") {
            // create and add view
            var view = new cdb.admin.PrivateTable({ model: table });
            $content.find('ul').append(view.render().el);

            // add bind
            view.bind('changed',  self._checkTables,  self);
            view.bind('error',    self._showError,    self);
            view.bind('loading',  self._hideError,    self);

            // add subview
            self.addView(view);
          }
        })
      }

      return $content;
    },

    _anyPrivateTable: function() {
      if (!this.model.related_tables) {
        return false;
      } else {
        return this.model.related_tables.filter(function(table) {
          return table.get("privacy").toLowerCase() == "private"
        }).length > 0;  
      }
    },

    _checkTables: function() {
      if (!this._anyPrivateTable()) {
        this.active = true;
        var ok_next = this.options.ok_next || this._TEXTS.ok_next;
        this.trigger('allTablesPublic');
        this.$('a.ok')
          .text(ok_next)
          .attr('href', '#/' + ok_next.replace(/ /g,'-').toLowerCase());
      }
    },

    _showError: function() {
      this.$('p.error').show();
    },

    _hideError: function() {
      this.$('p.error').hide();
    },

    _ok: function(e) {
      if (e) e.preventDefault();

      if (this.active) {
        this.ok && this.ok();
      }

      this.hide();
    }
  });



  /**
   *  Generate table showing its privacy (PRIVATE), you can change it
   *  at any time.
   *
   *  var private_table = new cdb.admin.PrivateTable({
   *    model: table_model
   *  });
   */

  cdb.admin.PrivateTable = cdb.core.View.extend({

    _TEXTS: {
      privacy: {
        public: _t('public')
      } 
    },

    tagName: 'li',

    events: {
      'click .make_public': '_makePublic'
    },

    initialize: function() {
      _.bindAll(this, '_makePublic');
      this.template = cdb.templates.getTemplate('old_common/views/share_private_table_view');
      this.loading = false;
      this._initBinds();
    },

    _initBinds: function() {
      this.model.bind('change:privacy', this._changePrivacy, this);
    },

    render: function() {
      this.$el.append(this.template(this.model.toJSON()));
      return this;
    },

    _changePrivacy: function() {
      // Hide loader
      this._hideLoader();

      // Change element
      this.$('a.make_public').fadeOut();
      this.$('span.status')
        .removeClass('private')
        .addClass('public')
        .text(this._TEXTS.privacy.public.toUpperCase());
    },

    _makePublic: function(e) {
      e.preventDefault();

      if (this.loading) return;

      var self = this;
      self.loading = true;

      // loading state
      this.trigger('loading');

      // Show loader
      this._showLoader();

      this.model.save({
        'privacy': "PUBLIC"
      }, {
        silent: true,
        wait: true,
        success: function(m) {
          self.trigger('changed');
          self.loading = false;
          self._changePrivacy();
        },
        error: function() {
          // Hide loader
          self.loading = false;
          self._hideLoader();
          self.trigger('error');
        }
      });
    },

    _showLoader: function() {
      this.$('a.button').addClass('disabled');
      this.$('span.loader').show();
    },

    _hideLoader: function() {
      this.$('a.button').removeClass('disabled');
      this.$('span.loader').hide();
    }

  });