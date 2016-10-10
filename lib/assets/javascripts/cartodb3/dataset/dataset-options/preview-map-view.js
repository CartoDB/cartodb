var CoreView = require('backbone/core-view');
var $ = require('jquery');
var cdb = require('cartodb.js');
var CreationModalView = require('../../components/modals/creation/modal-creation-view');
var VisDefinitionModel = require('../../data/vis-definition-model');
var SQLUtils = require('../../helpers/sql-utils');
var errorParser = require('../../helpers/error-parser');
var template = require('./preview-map.tpl');
var ESC_KEY_CODE = 27;

module.exports = CoreView.extend({

  className: 'PreviewMap',

  events: {
    'click .js-back': 'clean',
    'click .js-createMap': '_createMap'
  },

  initialize: function (opts) {
    if (!opts.tableModel) throw new Error('tableModel is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.visModel) throw new Error('visModel is required');
    if (!opts.syncModel) throw new Error('syncModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.userModel) throw new Error('userModel is required');

    this._tableModel = opts.tableModel;
    this._configModel = opts.configModel;
    this._userModel = opts.userModel;
    this._modals = opts.modals;
    this._querySchemaModel = opts.querySchemaModel;
    this._syncModel = opts.syncModel;
    this._visModel = opts.visModel;

    this._canCreateMap = this._userModel.hasCreateMapsFeature();

    this._onKeyDown = this._onKeyDown.bind(this);
    this._initKeydownBinds();
  },

  render: function () {
    var tableName = this._tableModel.getUnqualifiedName();
    var defaultQuery = 'SELECT * FROM ' + tableName;

    if (this._userModel.isInsideOrg()) {
      var userName = this._tableModel.get('permission').owner.username;
      defaultQuery = SQLUtils.prependTableName(defaultQuery, tableName, userName);
    }
    var isCustomQueryApplied = !SQLUtils.isSameQuery(defaultQuery, this._querySchemaModel.get('query'));

    this.$el.html(
      template({
        isOwner: this._tableModel.isOwner(this._userModel),
        isSync: this._syncModel.isSync(),
        syncState: this._syncModel.get('state'),
        name: this._tableModel.get('name'),
        isCustomQueryApplied: isCustomQueryApplied,
        canCreateMap: this._createMapEnabled
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
        authToken: this._configModel.get('auth_tokens')
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
