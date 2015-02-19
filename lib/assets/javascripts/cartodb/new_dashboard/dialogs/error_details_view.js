var $ = require('jquery');
var cdb = require('cartodb.js');
var BaseDialog = require('new_common/views/base_dialog/view');

/** 
 *  When an import fails, this dialog displays
 *  all the error info.
 *
 */

module.exports = BaseDialog.extend({

  className: 'Dialog ErrorDetails is-opening',

  initialize: function() {
    this.elder('initialize');
    this.template = cdb.templates.getTemplate('new_dashboard/views/error_details');
  },

  render_content: function() {
    var error = this.model.getError();
    var d = {
      error_code: error.error_code,
      title: error.title,
      text: error.what_about,
      item_queue_id: error.item_queue_id
    };
    return this.template(d);
  }

})