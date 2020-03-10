const ImportDataHeaderView = require('builder/components/modals/add-layer/content/imports/import-data/import-data-header-view');

/**
 *  Database header view
 *
 */

module.exports = ImportDataHeaderView.extend({

  events: {
    'click .js-back': '_goToPreviousStep'
  },

  render: function () {
    var acceptSync = this.options.acceptSync && this._userModel.get('actions') && this._userModel.isActionEnabled('sync_tables') && this.model.get('type') !== 'file';

    this.$el.html(
      this.template({
        type: this.model.get('type'),
        fileEnabled: this.options.fileEnabled,
        acceptSync: acceptSync,
        state: this.model.get('state'),
        title: this.options.title
      })
    );
    this._checkVisibility();
    return this;
  },

  _checkVisibility: function () {
    const state = this.model.get('state');
    if (state === 'connected' || state === 'selected') {
      this.show();
    } else {
      this.hide();
    }
  },

  _goToPreviousStep: function () {
    this.model.set('state', 'connected');
    this.model.set('service_name', 'connector');
  }
});
