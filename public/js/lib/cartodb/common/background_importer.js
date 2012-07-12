/**
 * Visualizes the status of the imports on background
 *
 * usage example:
 *
 *    var bkg_importer = new cdb.ui.common.BackgroundImporter({
 *        state: "",
 *    });
 *
 *    // Change state - not showing when empty state
 *    bkg_importer.changeState('creating');
 *    // close it
 *    bkg_importer.hide();
*/

cdb.ui.common.BackgroundImporter = cdb.core.View.extend({

  default_options: {
      state: ''
  },

  initialize: function() {
    _.bindAll(this, "show", "hide", "changeState");

    // Extend options
    _.defaults(this.options, this.default_options);

    // Dropdown template
    this.template_base = cdb.templates.getTemplate(this.options.template_base);

    this.state = this.options.state;

  },

  render: function() {
    this.$el.html(this.template_base({state: this.state}));
    this.$el.stop().animate({opacity: 1}, 150);
    return this;
  },

  changeState: function(s) {
    var _self = this;
    this.state = s;
    this.$el.stop().animate({opacity: 0}, 150, function(){
      _self.render();
    });
  },

  hide: function() {
    var self = this;
    this.$el.stop().animate({opacity: 0}, 500);
  }

});
