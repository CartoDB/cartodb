var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');

module.exports = cdb.admin.DropdownMenu.extend({
  render: function() {
    var user = this.model;

    this.$el.html(this.template_base({
    }));

    // Necessary to hide dialog on click outside popup, for example.
    cdb.god.bind("closeDialogs", this.hide, this);

    // TODO: taken from existing code, how should dropdowns really be added to the DOM?
    $('body').append(this.el);

    return this;
  }
});
