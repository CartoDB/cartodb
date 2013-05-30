
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

    events: function(){
      return _.extend({},cdb.admin.BaseDialog.prototype.events,{
        'click a.make_public': '_makeTablePublic'
      });
    },

    initialize: function() {
      this.options = _.extend({
        title: this._TEXTS.title,
        template_name: 'common/views/dialog_base',
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
      return this.getTemplate('table/header/views/share_private_tables_dialog')(this.model.toJSON());
    },

    _makeTablePublic: function(e) {
      e.preventDefault();

      var _id = $(e.target).data('id');
      var $el = $(e.target).closest('li');
      var self = this;
      var table = new cdb.admin.CartoDBTableMetadata({ id: _id });
      
      // Set loading state
      this._setLoading(_id);

      // Hide error
      this._hideError();

      // Show loader
      this._showLoader($el);

      table.save({
        'privacy': "PUBLIC"
      }, {
        wait: true,
        success: function(m) {
          self._changeRelatedPrivacy(m.get('id'), $el);
          self._checkTables();
          delete table;
        },
        error: function() {
          // Hide loader
          self._hideLoader($el);
          // Show error
          self._showError();
          // Show error
          delete table;
        }
      });
    },

    _anyPrivateTable: function() {
      return _.filter(this.model.get("related_tables"), function(table) {
        return table.privacy.toLowerCase() == "private"
      }).length > 0;
    },

    _isLoading: function(_id) {
      var loading = false;
      _.each(this.model.get("related_tables"), function(table) {
        if (table.id == _id) {
          loading = table.loading;
        }
      });

      return loading;
    },

    _setLoading: function(_id) {
      _.each(this.model.get("related_tables"), function(table) {
        if (table.id == _id) {
          table.loading = true;
        }
      });
    },

    _changeRelatedPrivacy: function(_id, $el) {
      // Change model
      this.model.set(
        'related_tables',
        _.filter(this.model.get("related_tables"), function(table) {
          if (table.id == _id) {
            table.privacy = "PUBLIC";
            delete table.loading;
          }
          return table;
        })
      );

      // Hide loader
      this._hideLoader($el);

      // Change element
      $el.find('a.make_public').fadeOut();
      $el.find('span.status')
        .removeClass('private')
        .addClass('public')
        .text('PUBLIC');
    },

    _checkTables: function() {
      if (!this._anyPrivateTable()) {
        this.active = true;
        var ok_next = this.options.ok_next || this._TEXTS.ok_next;
        this.$('a.ok')
          .text(ok_next)
          .attr('href', '#/' + ok_next.replace(/ /g,'-').toLowerCase());
      }
    },

    _showLoader: function($el) {
      $el.find('a.button').addClass('disabled');
      $el.find('span.loader').show();
    },

    _hideLoader: function($el) {
      $el.find('a.button').removeClass('disabled');
      $el.find('span.loader').hide();
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