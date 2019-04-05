var Utils = require('builder/helpers/utils');
var SelectedDatasetView = require('builder/components/modals/add-layer/content/imports/import-selected-dataset-view');
var template = require('builder/components/modals/add-layer/content/imports/import-selected-dataset.tpl');

/**
 *  Selected BigQuery dataset
 *
 */

module.exports = SelectedDatasetView.extend({
  render: function() {
    var title = this.options.fileAttrs.title && this.model.get('value')[this.options.fileAttrs.title] || this.model.get('value');
    var description = this._genDescription();
    var ext = this.options.fileAttrs.ext ? Utils.getFileExtension(title) : '' ;

    if (this.options.fileAttrs.ext) {
      title = title && title.replace('.' + ext, '');
    }

    var upgradeUrl = window.upgrade_url;
    var userCanSync = this._userModel.isActionEnabled('sync_tables');
    var customInstall = this._configModel.get('cartodb_com_hosted');

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
