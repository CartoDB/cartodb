var cdb = require('cartodb-deep-insights.js');
var Utils = require('../../../../../../helpers/utils');
var SelectedDatasetView = require('../import-selected-dataset-view');
var template = require('../import-selected-dataset.tpl');

/**
 *  Selected ArcGIS dataset
 *
 *  - Displays the result when an ArcGIS url/dataset is selected, no matter the type.
 *  - It will show available sync options if user can and the url is an ArcGIS layer.
 *  - Upgrade link for people who don't have sync permissions.
 *
 */

module.exports = SelectedDatasetView.extend({
  render: function () {
    var title = this.options.fileAttrs.title && this.model.get('value')[this.options.fileAttrs.title] || this.model.get('value');
    var description = this._genDescription();
    var ext = this.options.fileAttrs.ext ? Utils.getFileExtension(title) : '';

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
        importCanSync: this.options.acceptSync && this._isArcGISLayer(title),
        userCanSync: userCanSync,
        showTrial: this._userModel.canStartTrial(),
        showUpgrade: !userCanSync && !customInstall && upgradeUrl && !this._userModel.isInsideOrg(),
        upgradeUrl: upgradeUrl
      })
    );
    return this;
  },

  _isArcGISLayer: function (url) {
    return url.search(/([0-9]+\/|[0-9]+)/) !== -1;
  }

});
