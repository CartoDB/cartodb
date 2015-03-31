
  /**
   *  User quota dialog
   *
   *  Choose or change the quota assigned for a
   *  new/created user.
   *
   *  new cdb.admin.organization.QuotaDialog({
   *    user: user_model,
   *    collection: users_collection,
   *    organization: organization_model
   *  })
   *
   */


  cdb.admin.organization.QuotaDialog = cdb.admin.BaseDialog.extend({

    _TEXTS: {
      title:  {
        username: _t('Update <%- username %>\'s quota'),
        new_user: _t('Update quota') 
      },
      ok:         _t('Update')
    },

    events: function(){
      return _.extend({},cdb.admin.BaseDialog.prototype.events,{
        'keyup input': "_onInputChange"
      });
    },

    initialize: function(opts) {
      var self = this;
      this.user = this.options.user;

      var title = _.template(
        self._TEXTS.title[this.user.get('username') ? 'username' : 'new_user' ]
      )(this.user.toJSON());

      _.extend(this.options, {
        title: title,
        description: "",
        clean_on_hide: true,
        enter_to_confirm: true,
        ok_button_classes: "right button grey",
        ok_title: self._TEXTS.ok,
        cancel_button_classes: "hide",
        modal_type: "creation quota_dialog",
        width: 400
      });

      this.model = new cdb.core.Model({ state: 'idle' });

      this._calculateQuotas();
      this._initBinds();

      this.constructor.__super__.initialize.apply(this);
    },

    render_content: function() {
      return this.getTemplate('organization/views/label_update_quota')(this.model.toJSON());
    },

    _initBinds: function() {
      this.model.bind('change:state', this._toggleError, this);
    },

    _calculateQuotas: function() {
      var assigned = 0;

      this.collection.each(function(m) {
        assigned += m.get('quota_in_bytes')
      });

      var available = this.options.organization.get('quota_in_bytes') - assigned;

      // If user is being edited, we have to sum up user quota + available space
      if (this.user.get('username')) {
        available += this.user.get('quota_in_bytes');
      }

      this.model.set({
        max_quota: available,
        max_quota_readable: cdb.Utils.readablizeBytes(available),
        quota_in_MB: this._BYtoMB(this.user.get('quota_in_bytes')).toFixed(2) || Math.min(this._BYtoMB(available),100),
        max_quota_in_MB: this._BYtoMB(available)
      });
    },

    _isValidQuota: function(v) {
      return !isNaN(v) &&
        isFinite(v) &&
        (typeof(v) == 'number' || v.replace(/^\s+|\s+$/g, '').length > 0) &&
        ( this.model.get('max_quota_in_MB') >= v ) &&
        ( v > 0 );
    },

    _onInputChange: function() {
      var value = this.$('input').val();
      if (this._isValidQuota(value)) {
        this.model.set('state', 'idle');
      } else {
        this.model.set('state', 'error')
      }
    },

    _MBtoBY: function(value) {
      return value * Math.pow(1024,2)
    },

    _BYtoMB: function(value) {
      return value / Math.pow(1024,2)
    },

    _toggleError: function() {
      this.$('div.info')[ this.model.get("state") == "idle" ? 'removeClass' : 'addClass']('active error');
    },

    _ok: function(e) {
      if (e) e.preventDefault();
      var value = this.$('input').val();

      if (this._isValidQuota(value)) {
        this.user.set('quota_in_bytes', this._MBtoBY(value));
        this.hide();
      }

      return false;
    }

  });