var cdbadmin = require('cdb.admin');

module.exports = cdbadmin.DropdownMenu.extend({
  render: function() {
    this.$el.html(this.template_base({
      isInsideOrg: this.model.isInsideOrg()
    }));

    return this;
  }
});
