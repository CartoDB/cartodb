var cdb = require('cartodb.js-v3');
var BaseDialog = require('../../views/base_dialog/view');
var randomQuote = require('../../view_helpers/random_quote');

/**
 * Lock/unlock datasets/maps dialog.
 */
module.exports = BaseDialog.extend({

  events: BaseDialog.extendEvents({
    'click .js-ok': '_confirm',
    'click .js-download': '_download',
    'click .js-cancel': '_abortExport'
  }),

  initialize: function (attrs) {
    this.elder('initialize');

    this._initBinds();
  },

  render_content: function () {
    var state = this.model.get('state');

    if (state === 'complete') {
      var w = window.open(this.model.get('url'));

      // If w is undefined, popup was blocked: we show a "click to download" modal. Else, download has started.
      if (w == null) return cdb.templates.getTemplate('common/dialogs/export_map/templates/download');

      w.focus();
      this.close();
    } else if (state === 'failure') {
      return cdb.templates.getTemplate('common/templates/fail')({
        msg: 'Export has failed'
      });
    } else if (state === 'pending' || state === 'exporting' || state === 'uploading') {
      var loadingTitle = state.charAt(0).toUpperCase() + state.slice(1) + ' ...';

      return this.getTemplate('common/templates/loading')({
        title: loadingTitle,
        quote: randomQuote()
      });
    } else {
      return cdb.templates.getTemplate('common/dialogs/export_map/templates/confirm');
    }
  },

  _confirm: function () {
    this.model.requestExport();
  },

  _download: function () {
    window.open(this.model.get('url'));
    window.focus();

    this.close();
  },

  _abortExport: function () {
    this.model.cancelExport();
    this.close();
  },

  _initBinds: function () {
    this.model.bind('change:state', function () { this.render(); }, this);
  }
});
