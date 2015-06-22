var cdb = require('cartodb.js');
var BaseDialog = require('../../../views/base_dialog/view');
var pluralizeString = require('../../../view_helpers/pluralize_string');
var Utils = require('cdb.Utils');

/**
 *  When a Twitter import finishes, this dialog displays
 *  all the info about the price/cost etc.
 *
 */

module.exports = BaseDialog.extend({

  className: 'Dialog BackgroundPollingDetails is-opening',

  initialize: function() {
    this.elder('initialize');
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate('common/background_polling/views/geocodings/geocoding_success_result');
  },

  /*
  
  paid: "<% if (!success) { %><p>It seems that some of your rows didn't finish successfully. Perhaps these rows contained empty values or perhaps we just didn't know what the values meant. <% if (!googleUser) { %>Unsuccessful rows don't count against your quota, so we encourage you to take a look and try again.<% } %></p><% } %>" + 
      "<% if (!googleUser) { %><p><% if (price == 0) { %>This job cost you <strong>$0</strong> because we love you! You have <strong><%- remaining_quota %></strong> geocoding tokens remaining in your free quota this month.<% } else { %>This job cost you <strong>$<%- price/100 %></strong> because <strong><%- used_credits %></strong> geocoding credit<%- used_credits == 1 ? '' : 's'  %> <%- used_credits == 1 ? 'was' : 'were'  %> over your freely available quota. This will be added to next months bill.<% } %></p><% } %>",

  one_paid: "<% if (!success) { %><p>It seems that some of your rows didn't finish successfully. Perhaps these rows contained empty values or perhaps we just didn't know what the values meant. <% if (!googleUser) { %>Unsuccessful rows don't count against your quota, so we encourage you to take a look and try again.<% } %></p><% } %>" + 
      "<% if (!googleUser) { %><p><% if (price == 0) { %>This job cost you <strong>$0</strong> because we love you! You have <strong><%- remaining_quota %></strong> geocoding tokens remaining in your free quota this month.<% } else { %>This job cost you <strong>$<%- price/100 %></strong> because <strong><%- used_credits %></strong> geocoding credit<%- used_credits == 1 ? '' : 's'  %> <%- used_credits == 1 ? 'was' : 'were'  %> over your freely available quota. This will be added to next months bill.<% } %></p><% } %>",

  zero_paid: "<p>Perhaps these rows contained empty values or perhaps we just didn't know what the values meant.</p><% if (!googleUser) { %><p>Unsuccessful rows don't count against your quota, so we encourage you to take a look and try again.</p><% } %>",

  free: "<% if (!success){ %><p>It seems that some of your rows didn't finish successfully. Perhaps these rows contained empty values or perhaps we just didn't know what the values meant. We encourage you to take a look and try again.</p><% } %>" +
        "<p><% if (!googleUser) { %>This job cost you <strong>$0</strong> because we love you for being you!<% } else { %><% } %></p>",

  zero_free: "<p>It seems that some of your rows didn't finish successfully. Perhaps these rows contained empty values or perhaps we just didn't know what the values meant. We encourage you to take a look and try again.</p>",

  zero_processable: "<p>It seems that there are no georeferenceable rows. Please make sure that you have more than one row and that, if the column cartodb_georef_status exists, some of them have it set to null.</p>"
  
  */

  // if (msg.kind != "high-resolution") { // FREE

  //   if (success){

  //     title = (msg.real_rows == 1 ? "One" : pretty_real_rows) + " out of " + (msg.processable_rows == 1 ? "one" : pretty_processable_rows) + " row" + (msg.processable_rows == 1 ? " " : "s ") + (msg.processable_rows == 1 ? "was" : "were") + " succesfully turned into " + (msg.geometry_type || 'point') + "s!"

  //     if (msg.real_rows == 1) {
  //       description = _.template(this._TEXTS.free)(msg);
  //     } else {
  //       description = _.template(this._TEXTS.free)(msg);
  //     }

  //   } else if (msg.real_rows == 0) {
  //     title = this._TEXTS.success.title.empty;
  //     description = (msg.processable_rows == 0 ? _.template(this._TEXTS.zero_processable)(msg) : _.template(this._TEXTS.zero_free)(msg));
  //   } else {

  //     title = (msg.real_rows == 1 ? "One" : pretty_real_rows) + " out of " + (msg.processable_rows == 1 ? "one" : pretty_processable_rows) + " row" + (msg.processable_rows == 1 ? " " : "s ") + (msg.processable_rows == 1 ? "was" : "were") + " succesfully turned into " + (msg.geometry_type || 'point') + "s!"

  //     description = _.template(this._TEXTS.free)(msg);
  //   }

  // } else {

  //   var row_count = msg.real_rows;
  //   title = (msg.real_rows == 1 ? "One" : pretty_real_rows) + " out of " + (msg.processable_rows == 1 ? "one" : pretty_processable_rows) + " row" + (msg.processable_rows == 1 ? " " : "s ") + (msg.processable_rows == 1 ? "was" : "were") + " succesfully turned into " + (msg.geometry_type || 'point') + "s!"

  //   if (success) {
  //     if (msg.real_rows == 1) {
  //       description = _.template(this._TEXTS.one_paid)(msg);
  //     } else {
  //       description = _.template(this._TEXTS.paid)(msg);
  //     }
  //   } else if (msg.real_rows == 0) {
  //     title = this._TEXTS.success.title.empty;
  //     description = (msg.processable_rows == 0 ? _.template(this._TEXTS.zero_processable)(msg) : _.template(this._TEXTS.zero_paid)(msg));
  //   } else {
  //     description = _.template(this._TEXTS.paid)(msg);
  //   }
  // }



  render_content: function() {
    var proccessedRows = this.model.get('processed_rows') || 0;
    var proccessableRows = this.model.get('processable_rows') || 0;
    var googleUser = this.user.featureEnabled('google_maps');
    var price = this.model.get('price');

    var d = {
      price: price,
      googleUser: googleUser,
      tableName: this.model.get('table_name'),
      state: this.model.get('state') || '',
      proccessedRows: proccessedRows,
      processableRows: proccessableRows,
      rowsPluralize: pluralizeString('row', 'rows', proccessableRows)
    }
    return this.template(d);
  }

});
