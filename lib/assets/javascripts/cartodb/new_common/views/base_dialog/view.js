var cdb = require('cartodb.js');

/**
 * Abstract view for a dialog, a kind of view that takes up the full screen overlaying any previous content.
 *
 * To be extended for a specific use-case.
 * It inherits from CartoDB.js' Dialog view so has some particular behavior/convention of how to be used, see example
 *
 * Example of how to use:
 *   // Extend this view
 *   var MyDialog = BaseDialog.extend({
 *     render_content: function() {
 *       return 'Hello world!';
 *     }
 *   });
 *
 *   // Create instance object.
 *   var dialog = new MyDialog();
 *
 *   // To render & show initially (only to be called once):
 *   dialog.appendToBody();
 */
module.exports = cdb.ui.common.Dialog.extend({
  className: 'Dialog',

  overrideDefaults: {
    template_name: 'new_common/views/base_dialog/template',
    clean_on_hide: true
  },

  initialize: function() {
    // Override defaults of parent
    _.defaults(this.options, this.overrideDefaults);
    this.elder('initialize');
  },

  /**
   * @override cdb.ui.common.Dialog.prototype._cancel to implement animation upon closing the dialog
   */
  _cancel: function(e) {
    this.killEvent(e);
    this.$el.addClass('Dialog--closing');

    // Use timeout instead of event listener on animation since the event triggered differes depending on browser
    // Timing won't perhaps be 100% accurate but it's good enough
    // The timeout should match the .Dialog--closing animation duration.
    var self = this;
    setTimeout(function() {
      cdb.ui.common.Dialog.prototype._cancel.apply(self, arguments);
    }, 80); //ms
  }
});
