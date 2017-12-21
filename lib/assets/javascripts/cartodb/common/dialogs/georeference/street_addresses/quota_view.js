var cdb = require('cartodb.js-v3');

module.exports = cdb.core.View.extend({

  className: 'Georeference-quota',

  render: function() {
    this.$el.html(
      this.getTemplate('common/dialogs/georeference/street_addresses/quota')({
        quotaLeft: this.model.quotaLeftThisMonth(),
        quotaUsedInPct: this.model.quotaUsedThisMonthInPct()
      })
    );
    return this;
  }

});
