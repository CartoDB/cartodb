var cdb = require('cartodb.js');
var BaseDialog = require('../views/base_dialog/view');

/**
 *  When an import fails, this dialog displays
 *  all the error info.
 *
 */

module.exports = BaseDialog.extend({

  className: 'Dialog SuccessDetails is-opening',

  initialize: function() {
    this.elder('initialize');
    this.template = cdb.templates.getTemplate('common/background_importer/success_details');
  },

  render_content: function() {
    return this.template();
  }

})
