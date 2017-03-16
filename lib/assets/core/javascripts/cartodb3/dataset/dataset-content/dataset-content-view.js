var CoreView = require('backbone/core-view');
var TableManager = require('../../components/table/table-manager');
var DatasetContentOptionsView = require('./dataset-content-options-view');
var checkAndBuildOpts = require('../../helpers/required-opts');

var REQUIRED_OPTS = [
  'analysisDefinitionNodeModel',
  'configModel',
  'modals',
  'userModel'
];

module.exports = CoreView.extend({

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  render: function () {
    this.clearSubViews();
    this._initViews();
    return this;
  },

  _initViews: function () {
    var tableView = TableManager.create({
      relativePositionated: true,
      analysisDefinitionNodeModel: this._analysisDefinitionNodeModel,
      configModel: this._configModel,
      modals: this._modals,
      userModel: this._userModel
    });
    this.addView(tableView);
    this.$el.append(tableView.render().el);

    var datasetContentOptionsView = new DatasetContentOptionsView({
      modals: this._modals,
      userModel: this._userModel,
      analysisDefinitionNodeModel: this._analysisDefinitionNodeModel,
      configModel: this._configModel
    });
    datasetContentOptionsView.bind('addColumn', function () {
      tableView.addColumn();
    });
    datasetContentOptionsView.bind('addRow', function () {
      tableView.addRow();
    });

    this.addView(datasetContentOptionsView);
    this.$el.prepend(datasetContentOptionsView.render().el);
  }
});
