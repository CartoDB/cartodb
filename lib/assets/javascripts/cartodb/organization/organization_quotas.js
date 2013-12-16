
  /**
   *  Manage organization quotas
   *  in the right aside.
   *
   *  - It needs an organization model and collection.
   *
   *    new cdb.admin.organization.Quotas({
   *      model: organization_model,
   *      collection: organization_users
   *    });
   *
   */

  cdb.admin.organization.Quotas = cdb.core.View.extend({

    render: function() {
      // Seats quota
      var seats_quota = (this.collection.size() * 100)/ this.model.get('seats');
      var seats_warning = this._getQuotaStatus(seats_quota);
      this.$('div.seats > .progress-bar > .bar-2')
        .addClass(seats_warning)
        .width(seats_quota);

      // Disk quota
      var user_quotas = this._getUsersQuotas();
      var user_warning = this._getQuotaStatus(user_quotas);
      
      this.$('div.space > .progress-bar > .bar-2')
        .addClass(user_warning)
        .width((user_quotas.used * 100)/ this.model.get('quota_in_bytes'))
        .closest('.progress-bar')
        .find('> .bar-1').width((user_quotas.available * 100)/ this.model.get('quota_in_bytes'));

      return this;
    },

    // Know the status of the quota [danger or caution or nothing]
    _getQuotaStatus: function(quota) {
      if (quota >= 90) {
        return 'danger'
      } else if (quota > 75 && quota < 90) {
        return 'caution'
      } else {
        return ''
      }
    },


    // Get total bytes used by user     
    _getUsersQuotas: function() {
      var used, available = 0;

      this.collection.each(function(m) {
        used += m.get('quota_in_bytes') - m.get('remaining_quota');
        available += m.get('quota_in_bytes');
      });

      return { used: used, available: available }
    }

  })