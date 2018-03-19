var nodeModel = function (tableModel, synced, syncModel) {
  this.tableModel = tableModel;

  if (tableModel) {
    this.tableModel.isSync = function () {
      return synced || false;
    };
    this.tableModel._syncModel = syncModel;
    this.tableModel.getSyncModel = function () {
      return syncModel;
    };
    this.tableModel.isOwner = function () { return true; };
  }
};

module.exports = nodeModel;
