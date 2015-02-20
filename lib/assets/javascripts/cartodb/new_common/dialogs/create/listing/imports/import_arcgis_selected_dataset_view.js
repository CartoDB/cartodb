var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var Utils = require('cdb.Utils');
var urls = require('new_common/urls_fn');
var SelectedDataset = require('new_common/dialogs/create/listing/imports/import_selected_dataset_view');

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

    var upgradeAccountUrl = this.currentUserUrl.toUpgradeAccount();
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
        showUpgrade: !userCanSync && !customInstall && upgradeAccountUrl && !this.user.isInsideOrg(),
        upgradeURL: upgradeAccountUrl
      })
    );
    return this;
  },

  _isArcGISLayer: function(url) {
    return url.search(/([0-9]+\/|[0-9]+)/) !== -1  
  }

});