

  /**
   *  When a derived visualization is private, a dialog should be
   *  opened, where you can make it public and then continue with
   *  the process (show share, change tables to public,...)
   *
   *  var share_privacy = new cdb.admin.SharePrivateVisDialog({
   *    model: visualization_model
   *  });
   */

  cdb.admin.SharePrivateVisDialog = cdb.admin.BaseDialog.extend({

    _TEXTS: {
      title:      _t('Cannot publish this visualization'),
      ok:         _t('Make public'),
      ok_next:    _t('Share it now!')
    },

    initialize: function() {
      this.options = _.extend({
        title: this._TEXTS.title,
        template_name: 'old_common/views/dialog_base',
        clean_on_hide: true,
        enter_to_confirm: true,
        ok_button_classes: "button grey",
        ok_title: this._TEXTS.ok,
        cancel_button_classes: "underline margin15",
        modal_type: "confirmation",
        width: 510,
        modal_class: 'share_private_vis_dialog'
      }, this.options);

      this.active = false;
      this.loading = false;
      this.elder('initialize');
    },

    render_content: function() {
      return this.getTemplate('table/header/views/share_private_vis_dialog')(this.model.toJSON());
    },

    _makeVisPublic: function() {
      this.loading = true;
      var self = this;
      this._setLoading();

      this.model.save({
        privacy: 'PUBLIC'
      }, {
        wait: true,
        success: function() {
          self._setReady();
        },
        error: function() {
          self._setError();
        }
      })
    },

    // States
    _setLoading: function() {
      this.active = false;
      this.loading = false;

      this._hideError();
      this._showLoader();
      this._disableButton();
    },

    _setReady: function() {
      this.hide();
      this.ok && this.ok();
    },

    _setError: function() {
      this.active = false;
      this.loading = false;

      this._showError();
      this._hideLoader();
      this._enableButton();
    },


    // Shows, hides, active, disable,...
    _showError: function() {
      this.$('p.error').fadeIn();
    },

    _hideError: function() {
      this.$('p.error').fadeOut();
    },

    _showLoader: function() {
      this.$('span.loader').fadeIn();
    },

    _hideLoader: function() {
      this.$('span.loader').fadeOut();
    },

    _enableButton: function(text) {
      this.$('a.ok')
        .removeClass('disabled')
        .text(text || this._TEXTS.ok)
    },

    _disableButton: function() {
      this.$('a.ok').addClass('disabled');
    },


    // button action
    _ok: function(e) {
      if (e) e.preventDefault();

      // If it is still loading, stop
      if (this.loading) return false;

      if (!this.active) {
        this._makeVisPublic();
      }
    }
    
  });