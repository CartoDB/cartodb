var CoreView = require('backbone/core-view');
var template = require('./dataset-options.tpl');
var VisDefinitionModel = require('../../data/vis-definition-model');
var CreationModalView = require('../../components/modals/creation/modal-creation-view');
var errorParser = require('../../helpers/error-parser');
var MAP_URL_PARAMETER = '/builder/';

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
          var newVisModel = new VisDefinitionModel({
            name: self._visModel.get('name') + ' ' + _t('editor.map')
          }, {
            configModel: self._configModel
          });

          newVisModel.save({
            source_visualization_id: self._visModel.get('id')
          }, {
            success: function (visModel) {
              window.location = self._configModel.get('base_url') + MAP_URL_PARAMETER + visModel.get('id');
            },
            error: function (mdl, e) {
              opts.error && opts.error(errorParser(e));
            }
          });
        }
      });
    });
  }

});
