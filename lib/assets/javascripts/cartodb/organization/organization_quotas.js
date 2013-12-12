
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
      this.$('div.seats > .progress-bar > .bar-2').width(
        (this.collection.size() * 100)/ this.model.get('seats')
      )

      // Disk quota
      var user_quotas = this._getUsersQuotas();
      
      this.$('div.space > .progress-bar > .bar-2').width(
        (user_quotas.used * 100)/ this.model.get('quota_in_bytes')
      );
      
      this.$('div.space > .progress-bar > .bar-1').width(
        (user_quotas.available * 100)/ this.model.get('quota_in_bytes')
      );


      return this;
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