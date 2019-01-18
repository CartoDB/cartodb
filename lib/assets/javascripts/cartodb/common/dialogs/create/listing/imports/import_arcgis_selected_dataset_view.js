var cdb = require('cartodb.js-v3');
cdb.admin = require('cdb.admin');
var Utils = require('cdb.Utils');
var SelectedDataset = require('./import_selected_dataset_view');

/**
 *  Selected ArcGIS dataset
 *
 *  - Displays the result when an ArcGIS url/dataset is selected, no matter the type.
 *  - It will show available sync options if user can and the url is an ArcGIS layer.
 *  - Upgrade link for people who don't have sync permissions.
 *
 */

module.exports = SelectedDataset.extend({

  render: function() {
    var title = this.options.fileAttrs.title && this.model.get('value')[this.options.fileAttrs.title] || this.model.get('value');
    var description = this._genDescription();
    var ext = this.options.fileAttrs.ext ? Utils.getFileExtension(title) : '' ;

    if (this.options.fileAttrs.ext) {
      title = title && title.replace('.' + ext, '');
    }

    var upgradeUrl = window.upgrade_url;
    var userCanSync = this.user.get('actions') && this.user.get('actions').sync_tables;
    var customInstall = cdb.config.get('cartodb_com_hosted');

    this.$el.html(
      this.template({
        title: title,
        description: description,
        ext: ext,
        interval: this.model.get('interval'),
        importCanSync: this.options.acceptSync && this._isArcGISLayer(title),
        userCanSync: userCanSync,
        showTrial: this.user.canStartTrial(),
        showUpgrade: !userCanSync && !customInstall && upgradeUrl && !this.user.isInsideOrg(),
        upgradeUrl: upgradeUrl
      })
    );
    return this;
  },

  _isArcGISLayer: function(url) {
    return url.search(/([0-9]+\/|[0-9]+)/) !== -1
  }

});
