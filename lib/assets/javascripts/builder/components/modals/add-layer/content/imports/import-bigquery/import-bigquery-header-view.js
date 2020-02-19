const ImportDataHeaderView = require('builder/components/modals/add-layer/content/imports/import-data/import-data-header-view');

/**
 *  BigQuery header view
 *
 */

module.exports = ImportDataHeaderView.extend({
  events: {
    'click .js-back': '_goToPreviousStep'
  },

  _goToPreviousStep: function () {
    this.model.set('state', 'list');
    this.model.set('service_name', 'connector');
  }
});
