var $ = require('jquery');
var cdb = require('cartodb.js');
var BaseDialog = require('./views/base_dialog/view');

/** 
 *  When user wants to delete his own account
 *
 */

module.exports = BaseDialog.extend({

  options: {
    authenticity_token: '',
    username: ''
  },

  className: 'Dialog is-opening',

  initialize: function() {
    this.elder('initialize');
    this.template = cdb.templates.getTemplate('new_common/views/delete_account');
  },

  render_content: function() {
    return this.template(this.options);
  }

})