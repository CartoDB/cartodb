var cdb = require('cartodb.js');

/**
 * Default text
 *
 */
module.exports = cdb.core.Model.extend({

  confirmTitle: function(viewModel) {
    return 'You are about to <%= lockOrUnlockStr.toLowerCase() %> <%= itemsCount %> <%= contentTypePluralized %>.'
  },

  confirmDesc: function() {
'    <% if (areLocked) { %>
      By unlocking <%= thisOrTheseStr %> <%= contentTypePluralized %> <%= itOrTheyStr %> will be visible in the default list again.
    <% } else { %>
      By locking <%= thisOrTheseStr %> <%= contentTypePluralized %> <%= itOrTheyStr %> will be hidden from the default list.
      </p>
      <p class="Dialog-headerText">
      To see your locked <%= contentTypePluralized %> use the header menu, or click in the link at the bottom of the list.
    <% } %>'
  },

  cancelBtn: function() {
    return 'cancel';
  },

  confirmBtn: function() {
    return 'Ok, lockOrUnlock';
  }

});
