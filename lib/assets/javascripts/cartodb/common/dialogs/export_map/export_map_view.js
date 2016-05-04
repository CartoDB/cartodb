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
    switch (this.model.get('state')) {
      case 'pending':
        console.log('pending');
        break;

      case 'exporting':
        console.log('exporting');
        break;

      case 'uploading':
        console.log('uploading');
        break;

      case 'complete':
        console.log('complete');
        window.open(this.model.get('url'));
        break;

      case 'failure':
        console.log('failure');
        break;

      default:
        return cdb.templates.getTemplate('common/dialogs/export_map/templates/confirm');
        break;
    }
  },

  _confirm: function() {
    this.model.requestExport();
  },

  _registerEventListeners: function() {
    this.model.bind('change:state', function() {
      this.render();
    }.bind(this));
  }
});
