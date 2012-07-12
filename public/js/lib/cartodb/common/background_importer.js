/**
 * Visualizes the status of the imports on background
 *
 * usage example:
 *
 *    var bkg_importer = new cdb.ui.common.BackgroundImporter({
 *        el: "#settings_element",
 *        speedIn: 300,
 *        speedOut: 200
 *    });
 *    // show it
 *    bkg_importer.show();
 *    // close it
 *    bkg_importer.close();
*/

cdb.ui.common.BackgroundImporter = cdb.core.View.extend({

  default_options: {
      status: 'uploading'
  },

  initialize: function() {
    _.bindAll(this, "show", "hide", "_switchStatus");

    // Extend options
    _.defaults(this.options, this.default_options);

    // Dropdown template
    this.template_base = cdb.templates.getTemplate(this.options.template_base);

    this.status = this.options.status;
  },

  render: function() {
    // Render
    var $el = this.$el;
    $el.html(this.template_base({status: this.status}));
    return this;
  },

  _switchStatus: function(s) {
    this.status = s;
    this.render();
  },

  hide: function() {
    var self = this;
    this.$el.hide();
  },

  show: function() {
    this.$el.show();
    // this.$el.css({
    //   top: targetPos.top + targetHeight + 10,
    //   left: targetPos.left + targetWidth - this.options.width + 15,
    //   width: this.options.width,
    //   display: "block",
    //   opacity: 1
    // });
  },


});
