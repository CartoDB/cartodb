var BaseDialog = require('../../new_common/views/base_dialog/view');

/**
 *  Dialog for drop actions using mamufas
 *
 */


module.exports = BaseDialog.extend({

  className: 'Dialog is-opening MamufasDialog',

  initialize: function() {
    this.elder('initialize');
    this.template = cdb.templates.getTemplate('new_dashboard/views/mamufas_import_dialog_view');
  },

  render_content: function() {
    return this.template();
  },

  render: function() {
    this.elder('render');
    this.$('.Dialog-content').addClass('Dialog-content--expanded');
    return this;
  }

});