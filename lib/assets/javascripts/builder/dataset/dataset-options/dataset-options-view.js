var Backbone = require('backbone');
var $ = require('jquery');
var CoreView = require('backbone/core-view');
var VisDefinitionModel = require('builder/data/vis-definition-model');
var CreationModalView = require('builder/components/modals/creation/modal-creation-view');
var DatasetBaseView = require('builder/components/dataset/dataset-base-view');
var errorParser = require('builder/helpers/error-parser');
var PanelWithOptionsView = require('builder/components/view-options/panel-with-options-view');
var TabPaneView = require('builder/components/tab-pane/tab-pane-view');
var TabPaneCollection = require('builder/components/tab-pane/tab-pane-collection');
var Toggler = require('builder/components/toggler/toggler-view');
var DatasetEditorView = require('./dataset-sql-view');
var ActionView = require('./dataset-actions-view');
var PreviewMapView = require('./preview-map-view');
var ActionViewEdition = require('./dataset-actions-edition-view');
var DataSQLModel = require('builder/dataset/data-sql-model');
var SQLNotifications = require('builder/sql-notifications');
var MetricsTracker = require('builder/components/metrics/metrics-tracker');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'analysisDefinitionNodeModel',
  'configModel',
  'editorModel',
  'layerDefinitionModel',
  'modals',
  'onToggleEdition',
  'router',
  'userModel',
  'visModel'
];

module.exports = DatasetBaseView.extend({

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._querySchemaModel = this._analysisDefinitionNodeModel.querySchemaModel;

    if (!this._layerDefinitionModel.sqlModel) {
      var sqlHistory = this._layerDefinitionModel.options && this._layerDefinitionModel.options.sql_history;
      this._layerDefinitionModel.sqlModel = new DataSQLModel({
        content: this._querySchemaModel.get('query')
      }, {
        history: sqlHistory || []
      });
    }

    DatasetBaseView.prototype.initialize.call(this, {
      layerDefinitionModel: this._layerDefinitionModel,
      editorModel: this._editorModel,
      configModel: this._configModel,
      querySchemaModel: this._querySchemaModel
    });

    this._tableModel = this._analysisDefinitionNodeModel.getTableModel();
    this._queryGeometryModel = this._analysisDefinitionNodeModel.queryGeometryModel;
    this._canCreateMap = this._userModel.hasCreateMapsFeature();
    this._parseSQL = this._internalParseSQL.bind(this);

    SQLNotifications.track(this);

    this._togglerModel = new Backbone.Model({
      labels: [_t('dataset.data'), _t('dataset.sql')],
      active: this._editorModel.isEditing(),
      disabled: this._editorModel.isDisabled()
    });

    this._configPanes();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    this._checkClearButton();
    return this;
  },

  _initBinds: function () {
    this.listenTo(this._editorModel, 'change:edition', this._onChangeEdition);
    this.listenTo(this._editorModel, 'change:disabled', this._onChangeDisabled);
    this.listenTo(this._togglerModel, 'change:active', this._onTogglerChanged);
    this.listenTo(this._querySchemaModel, 'change:query_errors', this._showErrors);
    this.listenTo(this._visModel, 'change:name', this._onChangeName);
    this.listenTo(this._sqlModel, 'undo redo', function () {
      this._codemirrorModel.set('content', this._sqlModel.get('content'));
    });
  },

  _onChangeName: function (model, name) {
    this._codemirrorModel.set('content', this._analysisDefinitionNodeModel.getDefaultQuery());
  },

  _initViews: function () {
    var self = this;

    var panelWithOptionsView = new PanelWithOptionsView({
      editorModel: self._editorModel,
      createContentView: function () {
        return new TabPaneView({
          collection: self._collectionPane
        });
      },
      createControlView: function () {
        return new Toggler({
          model: self._togglerModel
        });
      },
      createActionView: function () {
        return new TabPaneView({
          collection: self._collectionPane,
          createContentKey: 'createActionView'
        });
      }
    });

    this.$el.append(panelWithOptionsView.render().el);
    this.addView(panelWithOptionsView);
  },

  _onChangeEdition: function () {
    this._onToggleEdition();

    var edition = this._editorModel.get('edition');
    var index = edition ? 1 : 0;
    this._collectionPane.at(index).set({ selected: true });
    this._togglerModel.set({ active: edition });
  },

  _onChangeDisabled: function () {
    var disabled = this._editorModel.get('disabled');
    this._togglerModel.set({ disabled: disabled });
  },

  _onTogglerChanged: function () {
    var checked = this._togglerModel.get('active');
    this._editorModel.set({ edition: checked });
  },

  _configPanes: function () {
    var self = this;
    var tabPaneTabs = [{
      selected: !this._editorModel.get('edition'),
      createContentView: function () {
        return new CoreView();
      },
      createActionView: function () {
        var actionViewOptions = {
          queryGeometryModel: self._queryGeometryModel,
          previewAction: self._previewMap.bind(self)
        };
        if (self._canCreateMap) {
          actionViewOptions.mapAction = self._createMap.bind(self);
        }
        return new ActionView(actionViewOptions);
      }
    }, {
      selected: this._editorModel.get('edition'),
      createContentView: function () {
        return new DatasetEditorView({
          editorModel: self._editorModel,
          codemirrorModel: self._codemirrorModel,
          onApplyEvent: self._parseSQL,
          layerDefinitionModel: self._layerDefinitionModel,
          querySchemaModel: self._querySchemaModel
        });
      },
      createActionView: function () {
        var actionViewOptions = {
          clearSQLModel: self._clearSQLModel,
          trackModel: self._sqlModel,
          editorModel: self._editorModel,
          queryGeometryModel: self._queryGeometryModel,
          querySchemaModel: self._querySchemaModel,
          onApply: self._parseSQL,
          previewAction: self._previewMap.bind(self),
          onClear: self._clearSQL.bind(self),
          applyButtonStatusModel: self._applyButtonStatusModel
        };
        if (self._canCreateMap) {
          actionViewOptions.mapAction = self._createMap.bind(self);
        }
        return new ActionViewEdition(actionViewOptions);
      }
    }];

    this._collectionPane = new TabPaneCollection(tabPaneTabs);
  },

  _runQuery: function (query, callback) {
    this._querySchemaModel.set({
      query: query,
      status: 'unfetched'
    });

    this._queryGeometryModel.set({
      query: query,
      simple_geom: '',
      status: 'unfetched'
    }, {
      silent: true
    });

    this._querySchemaModel.fetch({
      success: callback
    });

    this._queryGeometryModel.fetch();
  },

  _saveSQL: function () {
    var content = this._codemirrorModel.get('content');
    this._sqlModel.set('content', content);
    this._querySchemaModel.set('query_errors', []);

    if (this._tableModel.hasWriteAccess(this._userModel)) {
      this._layerDefinitionModel.save({
        sql: content
      });

      MetricsTracker.track('Applied sql', {
        dataset_id: this._tableModel.get('id'),
        sql: content
      });
    }

    SQLNotifications.showNotification({
      status: 'success',
      info: _t('notifications.sql.success'),
      closable: true
    });

    this._checkClearButton();
  },

  _defaultSQL: function () {
    return this._analysisDefinitionNodeModel.getDefaultQuery();
  },

  _previewMap: function () {
    var previewMap = new PreviewMapView({
      analysisDefinitionNodeModel: this._analysisDefinitionNodeModel,
      configModel: this._configModel,
      modals: this._modals,
      userModel: this._userModel,
      visModel: this._visModel
    });
    $('body').append(previewMap.render().el);
    this.addView(previewMap);
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
  }
});
