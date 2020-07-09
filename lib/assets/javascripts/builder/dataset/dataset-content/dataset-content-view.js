var CoreView = require('backbone/core-view');
var TableManager = require('builder/components/table/table-manager');
var DatasetContentOptionsView = require('./dataset-content-options-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'analysisDefinitionNodeModel',
  'configModel',
  'modals',
  'userModel',
  'visModel'
];

module.exports = CoreView.extend({

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this.listenTo(this._visModel, 'change:name', this._onChangeTableVisName);
  },

  render: function () {
    this.clearSubViews();
    this._initViews();
    return this;
  },

  _initViews: function () {
    this._tableView = TableManager.create({
      relativePositionated: true,
      analysisDefinitionNodeModel: this._analysisDefinitionNodeModel,
      configModel: this._configModel,
      modals: this._modals,
      userModel: this._userModel
    });
    this.addView(this._tableView);
    this.$el.append(this._tableView.render().el);

    var datasetContentOptionsView = new DatasetContentOptionsView({
      modals: this._modals,
      userModel: this._userModel,
      analysisDefinitionNodeModel: this._analysisDefinitionNodeModel,
      configModel: this._configModel,
      visModel: this._visModel
    });
    datasetContentOptionsView.bind('addColumn', function () {
      this._tableView.addColumn();
    }, this);
    datasetContentOptionsView.bind('addRow', function () {
      this._tableView.addRow();
    }, this);

    this.addView(datasetContentOptionsView);
    this.$el.prepend(datasetContentOptionsView.render().el);
  },

  _onChangeTableVisName: function () {
    // Although all operations related with table rename are managed in the analysis-definition-source-node-model
    // this columnsCollection doesn't belong to it and we need to take from it is generated.
    this._tableView && this._tableView.getColumnsCollection().setTableName(this._visModel.get('name'));
  }
});
