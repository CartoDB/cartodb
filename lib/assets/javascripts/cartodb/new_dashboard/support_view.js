/**
 *  Decide what support block app should show
 *
 */

module.exports = cdb.core.View.extend({

  initialize: function() {
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate('new_dashboard/views/support_banner');
  },

  render: function() {
    // Custom install?
    if (cdb.config.get('cartodb_com_hosted')) {
      this.hide();
      return this;
    }

    this.$el.html(
      this.template({
        belongsToOrg:   this.user.isInsideOrg(),
        // TODO: change this for any variable from user data
        paidUser:       this.user.get('account_type').toLowerCase() !== "free"
      })
    )
    return this;
  }
  
});