var cdb = require('cartodb.js');
var _ = require('underscore');
var randomQuote = require('../../view_helpers/random_quote');

/**
 *  Create template view
 *
 *  It will show a big loading when a new template is being created
 *
 */

module.exports = cdb.core.View.extend({

  className: 'IntermediateInfo',
  tagName: 'div',

  initialize: function() {
    this.user = this.options.user;
    this._initBinds();
  },

  render: function() {
    var currentImport = this.model.getCurrentImport();
    var d = {
      createModelType: 'map',
      type: 'map',
      state: this.model.get('state'),
      currentImport: currentImport,
      currentImportName: currentImport && currentImport.upl.get('name') || '',
      tableIdsArray: this.model.getImportedDatasets(),
      selectedDatasets: this.model.getPendingImports(),
      upgradeUrl: window.upgrade_url,
      freeTrial: this.user.get('show_trial_reminder'),
      quote: randomQuote()
    };

    if (currentImport) {
      d.err = currentImport.getError();
      d.err.item_queue_id = currentImport.get('id');
    }

    if (d.state === "error") {
      var sizeError = d.err && d.err.error_code && parseInt(d.err.error_code) === 8001;
      var userCanUpgrade = !cdb.config.get('custom_com_hosted') && (!this.user.isInsideOrg() || this.user.isOrgAdmin());

      this.template = cdb.templates.getTemplate(
        sizeError && userCanUpgrade ?
          'common/views/create/create_loading_upgrade' :
          'common/views/create/create_loading_error'
      )
    } else {
      this.template = cdb.templates.getTemplate('common/views/create/create_loading');
    }

    this.$el.html( this.template(d) );
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:state', this.render, this);
  }

});
