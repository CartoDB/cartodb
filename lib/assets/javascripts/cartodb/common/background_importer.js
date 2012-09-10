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
 *
 *  TODO: LOAD MORE TABLES AT THE SAME TIME
*/


cdb.ui.common.BackgroundImporter = cdb.core.View.extend({

  default_options: {
    import: {
      state: ''
    }
  },

  events: {
    'click a.error' : '_showError',
    'click a.table' : '_showTable'
  },

  className: "background_importer",

  initialize: function() {
    _.bindAll(this, "show", "hide", "changeState");

    // Extend options
    _.defaults(this.options, this.default_options);

    // Dropdown template
    this.template_base = cdb.templates.getTemplate(this.options.template_base);

    // Import information
    this.import = this.options.import;
  },

  render: function() {
    var content = this.template_base(this.import);
    this.$el.html(content);

    if (content.length > 50) {
      this.$el.stop()
        .css({opacity: 1})
        .animate({
          bottom: "0px"
        }, 500);

      this.delegateEvents();
    }
    
    return this;
  },

  changeState: function(imp) {
    var _self = this;
    this.import = imp;

    // HACK
    if (this.import.success != undefined)
      this.import.state = this.import.success ? "complete" : "failure";

    this.$el.stop().animate({opacity: 0}, 150, function(){
      _self.render();
    });
  },

  _showTable: function(ev) {
    ev.preventDefault();
    window.location.href = "/tables/" + this.import.table_id;
  },

  _showError: function(ev) {
    ev.preventDefault();
    var dialog = new cdb.admin.CreateErrorDialog({ 
      $el: $("body"),
      model: this.import
    });
    this.$el.append(dialog.render().el);
    dialog.open();

    this.$el.animate({
      bottom:"-35px"
    },300);
  },

  hide: function() {
    var self = this;
    this.$el.stop().animate({
      opacity: 0,
      bottom: "-35px"
    }, 500);
  },

});
