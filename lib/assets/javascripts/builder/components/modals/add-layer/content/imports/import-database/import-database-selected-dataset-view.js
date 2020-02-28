const SelectedDatasetView = require('builder/components/modals/add-layer/content/imports/import-selected-dataset-view');
const template = require('builder/components/modals/add-layer/content/imports/import-selected-dataset.tpl');

/**
 *  Selected DB connector dataset
 *
 */

module.exports = SelectedDatasetView.extend({
  render: function () {
    const title = this.model.get('value');
    const description = this._genDescription();
    const ext = 'sql';
    const upgradeUrl = this._configModel.get('upgrade_url');
    const userCanSync = this._userModel.isActionEnabled('sync_tables');
    const customInstall = this._configModel.get('cartodb_com_hosted');

    this.$el.html(
      template({
        title: title,
        description: description,
        ext: ext,
        interval: this.model.get('interval'),
        importCanSync: this.options.acceptSync,
        userCanSync: userCanSync,
        showTrial: this._userModel.canStartTrial(),
        showUpgrade: !userCanSync && !customInstall && upgradeUrl && !this._userModel.isInsideOrg(),
        upgradeUrl: upgradeUrl
      })
    );
    return this;
  }
});
