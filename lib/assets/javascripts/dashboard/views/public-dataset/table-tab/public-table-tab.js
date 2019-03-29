const TableTab = require('dashboard/views/public-dataset/table-tab/table-tab');
const PublicTableView = require('dashboard/views/public-dataset/public-table-view/public-table-view');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

module.exports = TableTab.extend({

  className: 'table public',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this.user = this.options.user;
    this.sqlView = this.options.sqlView;
  },

  _createTable: function () {
    this.tableView = new PublicTableView({
      configModel: this._configModel,
      dataModel: this.model.data(),
      model: this.model,
      sqlView: this.sqlView
    });
  }
});
