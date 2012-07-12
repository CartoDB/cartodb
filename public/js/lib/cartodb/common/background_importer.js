/**
 * Visualizes the status of the imports on background
 *
 * usage example:
 *
 *    var bkg_importer = new cdb.ui.common.BackgroundImporter({
 *        status: "",
 *    });
 *
 *    // Change status - not showing when empty status
 *    bkg_importer.changeStatus('creating');
 *    // close it
 *    bkg_importer.hide();
*/

cdb.ui.common.BackgroundImporter = cdb.core.View.extend({

  default_options: {
      status: ''
  },

  initialize: function() {
    _.bindAll(this, "show", "hide", "changeStatus");

    // Extend options
    _.defaults(this.options, this.default_options);

    // Dropdown template
    this.template_base = cdb.templates.getTemplate(this.options.template_base);

    this.status = this.options.status;

  },

  render: function() {
    this.$el.html(this.template_base({status: this.status}));
    this.$el.stop().animate({opacity: 1}, 150);
    return this;
  },

  changeStatus: function(s) {
    var _self = this;
    this.status = s;
    this.$el.stop().animate({opacity: 0}, 150, function(){
      _self.render();
    });
  },

  hide: function() {
    var self = this;
    this.$el.stop().animate({opacity: 0}, 500);
  }

});
