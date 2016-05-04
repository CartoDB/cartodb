var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var BaseDialog = require('../../views/base_dialog/view');
var pluralizeString = require('../../view_helpers/pluralize_string');
var randomQuote = require('../../view_helpers/random_quote');

/**
 * Lock/unlock datasets/maps dialog.
 */
module.exports = BaseDialog.extend({

  events: BaseDialog.extendEvents({
    'click .js-ok': '_confirm'
  }),

  initialize: function(attrs) {
    this.elder('initialize');

    this._registerEventListeners();
  },

  render_content: function() {
    var state = this.model.get('state');

    if (state === 'complete') {
      this.close();

      window.open(this.model.get('url'));
    } else if (state === 'failure') {
      return cdb.templates.getTemplate('common/templates/fail')({
        msg: 'Export has failed'
      });
    } else if (state === 'pending' || state === 'exporting' || state === 'uploading') {
      var loadingTittle = state.charAt(0).toUpperCase() + state.slice(1) + ' ...';

      return this.getTemplate('common/templates/loading')({
        title: loadingTittle,
        quote: randomQuote()
      });
    } else {
      return cdb.templates.getTemplate('common/dialogs/export_map/templates/confirm');
    }
  },

  _confirm: function(e) {
    this.model.requestExport();
  },

  _registerEventListeners: function() {
    this.model.bind('change:state', function() { this.render(); }, this);
  }
});
