var $ = require('jquery');
var cdb = require('cartodb.js');
var BaseDialog = require('../../new_common/views/base_dialog/view');

/** 
 *  When an import fails, this dialog displays
 *  all the error info.
 *
 */

module.exports = BaseDialog.extend({

  className: 'Dialog SuccessDetails is-opening',

  initialize: function() {
    this.elder('initialize');
    this.template = cdb.templates.getTemplate('new_dashboard/views/success_details');
  },

  render_content: function() {
    return this.template();
  }

})