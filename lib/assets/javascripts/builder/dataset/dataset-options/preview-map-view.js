var CoreView = require('backbone/core-view');
var $ = require('jquery');
var cdb = require('internal-carto.js');
var CreationModalView = require('builder/components/modals/creation/modal-creation-view');
var VisDefinitionModel = require('builder/data/vis-definition-model');
var errorParser = require('builder/helpers/error-parser');
var template = require('./preview-map.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var ESC_KEY_CODE = 27;

var REQUIRED_OPTS = [
  'analysisDefinitionNodeModel',
  'configModel',
  'modals',
  'userModel',
  'visModel'
];

module.exports = CoreView.extend({

  className: 'PreviewMap',

  events: {
    'click .js-back': 'clean',
    'click .js-createMap': '_createMap'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._tableModel = this._analysisDefinitionNodeModel.getTableModel();
    this._querySchemaModel = this._analysisDefinitionNodeModel.querySchemaModel;
    this._syncModel = this._tableModel.getSyncModel();
    this._canCreateMap = this._userModel.hasCreateMapsFeature();
    this._onKeyDown = this._onKeyDown.bind(this);

    this._initKeydownBinds();
  },

  render: function () {
    this.$el.html(
      template({
        isOwner: this._tableModel.isOwner(this._userModel),
        isSync: this._tableModel.isSync(),
        syncState: this._syncModel.get('state'),
        name: this._tableModel.get('name'),
        isCustomQueryApplied: this._analysisDefinitionNodeModel.isCustomQueryApplied(),
        canCreateMap: this._canCreateMap
      })
    );
    this._initViews();
    return this;
  },

  _initViews: function () {
    this._map = cdb.createVis(
      this.$('.js-map'),
      this._visModel.vizjsonURL(),
      {
        legends: false,
        authToken: this._configModel.get('auth_tokens'),
        mapzenApiKey: this._configModel.get('mapzenApiKey'),
        mapboxApiKey: this._configModel.get('mapboxApiKey')
      }
    );
  },

  _initKeydownBinds: function () {
    $(document).bind('keydown', this._onKeyDown);
  },

  _destroyKeydownBinds: function () {
    $(document).unbind('keydown', this._onKeyDown);
  },

  _onKeyDown: function (ev) {
    var keyCode = ev.which;
    if (keyCode === ESC_KEY_CODE) {
      this.clean();
    }
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
              window.location = visModel.builderURL();
            },
            error: function (mdl, e) {
              opts.error && opts.error(errorParser(e));
            }
          });
        }
      });
    });
  },

  clean: function () {
    this._destroyKeydownBinds();
    CoreView.prototype.clean.call(this);
  }

});
