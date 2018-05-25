const ShareViewContent = require('builder/components/modals/publish/share/share-view');

const DashboardShareViewContent = ShareViewContent.extend({
  _onSave: function () {},

  saveACLPermissions: function () {
    var permission = this._visDefinitionModel.getPermissionModel();
    permission.overwriteAcl(this._sharePermissionModel);

    return permission.save()
      .fail(this._searchPaginationView.showError.bind(this._searchPaginationView));
  }
});

module.exports = DashboardShareViewContent;
