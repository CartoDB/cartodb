var BaseDialog = require('../../new_common/views/base_dialog/view');

/**
 *  Dialog for drop actions using mamufas
 *
 */


module.exports = BaseDialog.extend({

  className: 'Dialog is-opening MamufasDialog',

  initialize: function() {
    // Override defaults of parent
    _.defaults(this.options, this.overrideDefaults);
    _.defaults(this.options, this.default_options);
    _.bindAll(this, 'render', '_keydown');
    // Keydown bindings for the dialog
    $(document).bind('keydown', this._keydown);
    // After removing the dialog, cleaning other bindings
    this.bind("clean", this._reClean);
    this.template_base = this.options.template_base ? _.template(this.options.template_base) : cdb.templates.getTemplate(this.options.template_name);
    this.bind('show', this._setBodyForDialogMode.bind(this, 'add'));
    var removeDialogModeFromBody = this._setBodyForDialogMode.bind(this, 'remove');
    this.bind('hide', removeDialogModeFromBody);
    this.template = cdb.templates.getTemplate('new_dashboard/views/mamufas_import_dialog_view');
  },

  render_content: function() {
    return this.template();
  },

  render: function() {
    this.elder('render');
    this.$('.Dialog-content').addClass('Dialog-content--expanded');
    return this;
  },

  show: function() {
    // Don't send any kind of openDialog signal
    this.$el.show();
    this.trigger('show');

    // Blur current element (e.g. a <a> tag that was clicked to open this window)
    if (document.activeElement) {
      document.activeElement.blur();
    }
  },

  _close: function(ev, finishFnName) {
    if (ev) {
      this.killEvent(ev);
    }
    this.$el.addClass('is-closing');

    // Use timeout instead of event listener on animation since the event triggered differs depending on browser
    // Timing won't perhaps be 100% accurate but it's good enough
    // The timeout should match the .Dialog.is-closing animation duration.
    var self = this;
    setTimeout(function() {
      self.hide();
      BaseDialog.prototype[finishFnName].call(self);
    }, 80); //ms
  },

});