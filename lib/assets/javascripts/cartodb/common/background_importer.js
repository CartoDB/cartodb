/**
 * Visualizes the status of the imports on background
 *
 * usage example:
 *
 *    var bkg_importer = new cdb.ui.common.BackgroundImporter({
 *        state: ""
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
    import_: {
      state: ''
    }
  },

  events: {
    'click a.error' : '_showError',
    'click a.table' : '_showTable',
    'click a.cancel': '_showCancel'
  },

  className: "background_importer",

  initialize: function() {
    _.bindAll(this, "show", "hide", "changeState");

    // Extend options
    _.defaults(this.options, this.default_options);

    // Dropdown template
    this.template_base = cdb.templates.getTemplate(this.options.template_base);

    // Import information
    this.import_ = this.options.import_;

    // Set current status
    this.current_state = this.import_.state || ''; 

    this.add_related_model(this.import_);

  },

  render: function() {
    var content = this.template_base(this.import_);
    this.$el.html(content);

    //HACK: change this or test it
    if (content.length > 50) {
      this.$el.stop()
        .css({opacity: 1})
        .animate({
          bottom: "20px"
        }, 500);

      this.delegateEvents();
    }
    
    return this;
  },

  changeState: function(imp) {
    var _self = this;

    // Same status, don't change anything
    if (this.current_state == imp.state) {
      return false;
    }

    // Set new status
    this.current_state = imp.state;

    // Set new import
    this.import_ = imp;

    // HACK
    if (this.import_.success != undefined) {
      this.import_.state = this.import_.success ? "complete" : "failure";
    }

    this.$el.stop().animate({opacity: 0}, 150, function(){
      _self.render();
    });
  },

  _showTable: function(ev) {
    ev.preventDefault();
    window.location.href = cdb.config.prefixUrl() + "/tables/" + (this.import_.table_name || this.import_.table_id);
  },

  _showCancel: function(ev) {
    ev.preventDefault();
    this.trigger('canceled');
    this.hide();
  },

  _showError: function(ev) {
    ev.preventDefault();
    var dialog = new cdb.admin.CreateErrorDialog({ 
      $el: $("body"),
      model: this.import_
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
  }

});
