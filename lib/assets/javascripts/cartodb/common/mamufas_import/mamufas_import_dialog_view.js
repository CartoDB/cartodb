var BaseDialog = require('../views/base_dialog/view');

/**
 *  Dialog for drop actions using mamufas
 *
 */


module.exports = BaseDialog.extend({

  className: 'Dialog is-opening MamufasDialog',

  overrideDefaults: {
    template_name: 'common/views/base_dialog/template',
    triggerDialogEvents: false
  },

  initialize: function() {
    BaseDialog.prototype.initialize.apply(this, arguments);
    this.template = cdb.templates.getTemplate('common/mamufas_import/mamufas_import_dialog');
  },

  render_content: function() {
    return this.template();
  },

  render: function() {
    this.elder('render');
    this.$('.Dialog-content').addClass('Dialog-content--expanded');
    return this;
  },

  hide: function() {
    BaseDialog.prototype.hide.apply(this, arguments);
    this.trigger('hide');
    this._setBodyForDialogMode('remove')
  }

});
