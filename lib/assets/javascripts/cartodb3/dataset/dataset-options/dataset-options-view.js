var CoreView = require('backbone/core-view');
var template = require('./dataset-options.tpl');
var CreationModalView = require('../../components/modals/creation/modal-creation-view');
var TITLE_SUFFIX = ' | CartoDB';
var DATASET_URL_PARAMETER = '/dataset/';

module.exports = CoreView.extend({

  events: {
    'click .js-createMap': '_createMap'
  },

  initialize: function (opts) {
    if (!opts.router) throw new Error('router is required');
    if (!opts.tableModel) throw new Error('tableModel is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.visModel) throw new Error('visModel is required');
    if (!opts.syncModel) throw new Error('syncModel is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._tableModel = opts.tableModel;
    this._configModel = opts.configModel;
    this._userModel = opts.userModel;
    this._modals = opts.modals;
    this._querySchemaModel = opts.querySchemaModel;
    this._syncModel = opts.syncModel;
    this._visModel = opts.visModel;
    this._router = opts.router;
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(
      template()
    );

    return this;
  },

  _createMap: function () {
    var self = this;
    var tableName = this._tableModel.getUnquotedName();

    this._modals.create(function (modalModel) {
      return new CreationModalView({
        modalModel: modalModel,
        loadingTitle: _t('dataset.create-map.loading', { tableName: tableName }),
        errorTitle: _t('dataset.create-map.error', { tableName: tableName }),
        runAction: function (opts) {
          console.log('running action');
          // tableDuplicationOperation({
          //   query: self._querySchemaModel.get('query'),
          //   tableModel: self._tableModel,
          //   configModel: self._configModel,
          //   onSuccess: function (importModel) {
          //     var tableName = importModel.get('table_name');
          //     window.location = self._configModel.get('base_url') + DATASET_URL_PARAMETER + tableName;
          //   },
          //   onError: function (importModel) {
          //     var error = importModel.get('get_error_text');
          //     var errorMessage = error && error.title;
          //     opts.error && opts.error(errorMessage);
          //   }
          // });
        }
      });
    });
  }

});
