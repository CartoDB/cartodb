var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
var CoreView = require('backbone/core-view');
var VisDefinitionModel = require('../../data/vis-definition-model');
var CreationModalView = require('../../components/modals/creation/modal-creation-view');
var errorParser = require('../../helpers/error-parser');
var PanelWithOptionsView = require('../../components/view-options/panel-with-options-view');
var TabPaneView = require('../../components/tab-pane/tab-pane-view');
var TabPaneCollection = require('../../components/tab-pane/tab-pane-collection');
var Toggler = require('../../components/toggler/toggler-view');
var DatasetEditorView = require('./dataset-sql-view');
var ActionView = require('./dataset-actions-view');
var PreviewMapView = require('./preview-map-view');
var ActionViewEdition = require('./dataset-actions-edition-view');
var DataSQLModel = require('../data-sql-model');
var SQLUtils = require('../../helpers/sql-utils');
var Notifier = require('../../components/notifier/notifier');
var cdb = require('cartodb.js');
var NOTIFICATION_TEMPLATE = _.template("<span class='CDB-Text is-semibold'><%- info %></span>");

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.router) throw new Error('router is required');
    if (!opts.tableModel) throw new Error('tableModel is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.visModel) throw new Error('visModel is required');
    if (!opts.syncModel) throw new Error('syncModel is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.editorModel) throw new Error('editorModel is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this._tableModel = opts.tableModel;
    this._configModel = opts.configModel;
    this._userModel = opts.userModel;
    this._modals = opts.modals;
    this._querySchemaModel = opts.querySchemaModel;
    this._syncModel = opts.syncModel;
    this._visModel = opts.visModel;
    this._router = opts.router;
    this._editorModel = opts.editorModel;
    this._layerDefinitionModel = opts.layerDefinitionModel;

    this._SQL = new cdb.SQL({
      user: this._configModel.get('user_name'),
      sql_api_template: this._configModel.get('sql_api_template'),
      api_key: this._configModel.get('api_key')
    });

    if (!this._layerDefinitionModel.sqlModel) {
      var sqlHistory = this._layerDefinitionModel.options && this._layerDefinitionModel.options.sql_history;
      this._layerDefinitionModel.sqlModel = new DataSQLModel({
        content: this._querySchemaModel.get('query')
      }, {
        history: sqlHistory || []
      });
    }

    this._codemirrorModel = new Backbone.Model({
      content: this._querySchemaModel.get('query'),
      readonly: false
    });

    this._clearSQLModel = new Backbone.Model({
      visible: false
    });

    this._sqlModel = this._layerDefinitionModel.sqlModel;

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
    this.add_related_model(this._editorModel);

    this._querySchemaModel.bind('change:query_errors', this._showErrors, this);
    this.add_related_model(this._querySchemaModel);

    this._visModel.on('change:name', this._onChangeName, this);
    this.add_related_model(this._visModel);

    this._sqlModel.bind('undo redo', function () {
      this._codemirrorModel.set('content', this._sqlModel.get('content'));
    }, this);
    this.add_related_model(this._sqlModel);
  },

  _onChangeName: function (model, name) {
    var oldName = model.previous('name');
    var newName = name;
    var content = this._codemirrorModel.get('content');
    var re = new RegExp(oldName, 'gi');
    var newContent = content.replace(re, newName);
    this._codemirrorModel.set('content', newContent);
    this._parseSQL();
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
          editorModel: self._editorModel,
          labels: [_t('dataset.data'), _t('dataset.sql')]
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
    this.$el.toggleClass('is-dark', this._editorModel.isEditing());

    var edition = this._editorModel.get('edition');
    var index = edition ? 1 : 0;
    this._collectionPane.at(index).set({ selected: true });
  },

  _configPanes: function () {
    var self = this;
    var tabPaneTabs = [{
      selected: !this._editorModel.get('edition'),
      createContentView: function () {
        return new CoreView();
      },
      createActionView: function () {
        return new ActionView({
          querySchemaModel: self._querySchemaModel,
          mapAction: self._createMap.bind(self),
          previewAction: self._previewMap.bind(self)
        });
      }
    }, {
      selected: this._editorModel.get('edition'),
      createContentView: function () {
        return new DatasetEditorView({
          editorModel: self._editorModel,
          codemirrorModel: self._codemirrorModel,
          onApplyEvent: self._parseSQL.bind(self)
        });
      },
      createActionView: function () {
        return new ActionViewEdition({
          clearSQLModel: self._clearSQLModel,
          trackModel: self._sqlModel,
          editorModel: self._editorModel,
          querySchemaModel: self._querySchemaModel,
          onApply: self._parseSQL.bind(self),
          mapAction: self._createMap.bind(self),
          previewAction: self._previewMap.bind(self),
          onClear: self._clearSQL.bind(self)
        });
      }
    }];

    this._collectionPane = new TabPaneCollection(tabPaneTabs);
  },

  _parseSQL: function () {
    var query = this._codemirrorModel.get('content');
    var altersData = SQLUtils.altersData(query);

    if (altersData) {
      var notification = Notifier.addNotification({
        status: 'loading',
        info: _t('editor.data.notifier.sql-alter-loading'),
        closable: false
      });

      this._sqlModel.set('content', query);

      this._SQL.execute(query, null, {
        success: function () {
          notification.set({
            status: 'success',
            info: NOTIFICATION_TEMPLATE({info: _t('editor.data.notifier.sql-alter-success')}),
            closable: true
          });
          // Clean SQL editor (with original query) and make a fetch
          this._clearSQL();
        }.bind(this),
        error: function (errors) {
          Notifier.removeNotification(notification);
          errors = errors.responseJSON.error;
          this._codemirrorModel.set('errors', this._parseErrors(errors));
        }.bind(this)
      });
    } else {
      // Parser errors SQL here and saving
      this._querySchemaModel.set({
        query: query,
        status: 'unfetched'
      });

      this._querySchemaModel.fetch({
        success: this._saveSQL.bind(this)
      });
    }
  },

  _showErrors: function (model) {
    var errors = this._querySchemaModel.get('query_errors');
    this._codemirrorModel.set('errors', this._parseErrors(errors));
  },

  _parseErrors: function (errors) {
    return errors.map(function (error) {
      return {
        message: error
      };
    });
  },

  _saveSQL: function () {
    var content = this._codemirrorModel.get('content');
    this._sqlModel.set('content', content);
    this._querySchemaModel.set('query_errors', []);
    this._layerDefinitionModel.save({
      sql: content
    });
    this._checkClearButton();
  },

  _clearSQL: function () {
    var sql = this._defaultSQL();
    this._codemirrorModel.set({content: sql});
    this._parseSQL();
  },

  _defaultSQL: function () {
    return 'SELECT * FROM ' + this._tableModel.getUnquotedName();
  },

  _checkClearButton: function () {
    var custom_sql = this._codemirrorModel.get('content').toLowerCase();
    var default_sql = this._defaultSQL().toLowerCase();
    this._clearSQLModel.set({visible: custom_sql !== default_sql});
  },

  _previewMap: function () {
    var previewMap = new PreviewMapView({
      tableModel: this._tableModel,
      configModel: this._configModel,
      querySchemaModel: this._querySchemaModel,
      syncModel: this._syncModel,
      userModel: this._userModel,
      visModel: this._visModel,
      modals: this._modals
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
