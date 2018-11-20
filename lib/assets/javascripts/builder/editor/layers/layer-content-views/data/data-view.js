var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var PanelWithOptionsView = require('builder/components/view-options/panel-with-options-view');
var ScrollView = require('builder/components/scroll/scroll-view');
var DatasetBaseView = require('builder/components/dataset/dataset-base-view');
var DataContentView = require('./data-content-view');
var DataSQLView = require('./data-sql-view');
var TabPaneView = require('builder/components/tab-pane/tab-pane-view');
var TabPaneCollection = require('builder/components/tab-pane/tab-pane-collection');
var Toggler = require('builder/components/toggler/toggler-view');
var UndoButtons = require('builder/components/undo-redo/undo-redo-view');
var Infobox = require('builder/components/infobox/infobox-factory');
var InfoboxModel = require('builder/components/infobox/infobox-model');
var InfoboxCollection = require('builder/components/infobox/infobox-collection');
var TableStats = require('builder/components/modals/add-widgets/tablestats');
var DataColumnsModel = require('./data-columns-model');
var SQLNotifications = require('builder/sql-notifications');
var MetricsTracker = require('builder/components/metrics/metrics-tracker');
var MetricsTypes = require('builder/components/metrics/metrics-types');
var OnboardingLauncher = require('builder/components/onboardings/generic/generic-onboarding-launcher');
var OnboardingView = require('builder/components/onboardings/layers/data-onboarding/data-onboarding-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var LocaleHelper = require('builder/helpers/locale');

var ONBOARDING_KEY = 'layer-data-onboarding';

var REQUIRED_OPTS = [
  'widgetDefinitionsCollection',
  'stackLayoutModel',
  'userActions',
  'layerDefinitionModel',
  'userModel',
  'onboardings',
  'onboardingNotification',
  'layerContentModel'
];

var getNotificationMessage = function (error, type) {
  var prefix = 'notifications.sql.';
  var key = prefix + type;
  var result = LocaleHelper.linkify(key);
  return result || (error && _.first(error)) || _t('notifications.sql.unknown.body');
};

module.exports = DatasetBaseView.extend({
  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this._nodeModel = opts.layerDefinitionModel.getAnalysisDefinitionNodeModel();
    this._querySchemaModel = this._nodeModel.querySchemaModel;
    this._queryGeometryModel = this._nodeModel.queryGeometryModel;

    DatasetBaseView.prototype.initialize.call(this, {
      layerDefinitionModel: opts.layerDefinitionModel,
      editorModel: opts.editorModel,
      configModel: opts.configModel,
      querySchemaModel: this._querySchemaModel
    });

    this._initModels();

    this._tableStats = new TableStats({
      configModel: this._configModel,
      userModel: this._userModel
    });

    this._columnsModel = new DataColumnsModel({}, {
      layerDefinitionModel: this._layerDefinitionModel,
      widgetDefinitionsCollection: this._widgetDefinitionsCollection,
      tableStats: this._tableStats
    });

    SQLNotifications.track(this);

    this._parseSQL = this._internalParseSQL.bind(this, this._afterAlterDataSuccess);

    this._onboardingLauncher = new OnboardingLauncher({
      view: OnboardingView,
      onboardingNotification: this._onboardingNotification,
      notificationKey: ONBOARDING_KEY,
      onboardings: this._onboardings
    }, {
      editorModel: this._editorModel,
      selector: 'LayerOnboarding'
    });

    this._configPanes();
    this._initBinds();
    this._initData();
  },

  render: function () {
    this._launchOnboarding();
    this.clearSubViews();
    this.$el.empty();

    this._initViews();

    return this;
  },

  _initModels: function () {
    this._infoboxModel = new InfoboxModel({
      state: this._isLayerHidden()
        ? 'layer-hidden'
        : ''
    });

    this._layerDefinitionModel.canBeGeoreferenced()
      .then(function (canBeGeoreferenced) {
        if (!this._isLayerHidden() && canBeGeoreferenced) {
          this._infoboxModel.set('state', 'georeference');
        }
      }.bind(this));

    this._overlayModel = new Backbone.Model({
      visible: this._isLayerHidden()
    });

    this._applyButtonStatusModel = new Backbone.Model({
      loading: false
    });

    this._togglerModel = new Backbone.Model({
      labels: [_t('editor.data.data-toggle.values'), _t('editor.data.data-toggle.cartocss')],
      active: this._editorModel.isEditing(),
      disabled: this._editorModel.isDisabled(),
      tooltip: _t('editor.data.data-toggle.tooltip')
    });
  },

  _launchOnboarding: function () {
    if (this._onboardingNotification.getKey(ONBOARDING_KEY)) {
      return;
    }

    if (!this._editorModel.isEditing()) {
      this._onboardingLauncher.launch({
        numberOfWidgets: this._widgetDefinitionsCollection.length,
        hasTimeSeries: this._widgetDefinitionsCollection.isThereTimeSeries(),
        hasAnimatedTimeSeries: this._widgetDefinitionsCollection.isThereTimeSeries({ animated: true })
      });
    }
  },

  _initData: function () {
    if (this._hasFetchedQuerySchema()) {
      this._onQuerySchemaStatusChange();
    }
  },

  _redirectIfErrors: function () {
    var errors = this._querySchemaModel.get('query_errors');
    if (errors && errors.length > 0) {
      this._showErrors();
      this._editorModel.set({
        edition: true
      });
    }
  },

  _onQuerySchemaChange: function () {
    if (this._hasFetchedQuerySchema()) {
      this._codemirrorModel.set({ content: this._querySchemaModel.get('query') });
    }
  },

  _onQuerySchemaStatusChange: function () {
    if (this._hasFetchedQuerySchema()) {
      this._columnsModel.createColumnCollection();
    }
  },

  _hasFetchedQuerySchema: function () {
    return this._querySchemaModel.isFetched();
  },

  _initBinds: function () {
    this.listenTo(this._editorModel, 'change:edition', this._onChangeEdition);
    this.listenTo(this._editorModel, 'change:disabled', this._onChangeDisabled);
    this.listenTo(this._togglerModel, 'change:active', this._onTogglerChanged);

    this.listenTo(this._querySchemaModel, 'change:query', this._onQuerySchemaChange);
    this.listenTo(this._querySchemaModel, 'change:status', this._onQuerySchemaStatusChange);
    this.listenTo(this._querySchemaModel, 'change:query_errors', this._showErrors);

    this.listenTo(this._sqlModel, 'undo redo', function () {
      this._codemirrorModel.set('content', this._sqlModel.get('content'));
    }.bind(this));

    this.listenTo(this._layerDefinitionModel, 'change:visible', this._infoboxState);

    this._querySchemaModel.bind('change:status', function () {
      this._applyButtonStatusModel.set('loading', this._querySchemaModel.isFetching());
    }, this);
  },

  _runQuery: function (query, callback) {
    // Should change the query to geometry model before the schema model
    this._queryGeometryModel.set({
      query: query
    });

    this._querySchemaModel.set({
      query: query,
      status: 'unfetched'
    });

    SQLNotifications.showNotification({
      status: 'loading',
      info: _t('notifications.sql.applying'),
      closable: false
    });

    var saveSQL = _.after(2, callback);
    var errorSQL = function (err) {
      var type = err && err.status;
      var error = getNotificationMessage(err.error, type);
      this._forceErrors(error, {
        showEditorError: type === 400
      });
    }.bind(this);

    this._querySchemaModel.fetch({ success: saveSQL, error: errorSQL });
    this._queryGeometryModel.fetch({ complete: saveSQL, error: errorSQL });
  },

  _saveSQL: function (response) {
    if (response.status !== 200) {
      return;
    }

    var query = this._codemirrorModel.get('content');

    this._sqlModel.set('content', query);
    this._userActions.saveAnalysisSourceQuery(query, this._nodeModel, this._layerDefinitionModel);
    this._querySchemaModel.set('query_errors', []);

    SQLNotifications.showNotification({
      status: 'success',
      info: _t('notifications.sql.success'),
      closable: true
    });

    this._checkClearButton();

    MetricsTracker.track(MetricsTypes.APPLIED_SQL, {
      node_id: this._nodeModel.get('id'),
      sql: this._nodeModel.get('query')
    });

    MetricsTracker.track(MetricsTypes.USED_ADVANCED_MODE, {
      mode_type: 'sql'
    });
  },

  _isQueryAlreadyApplied: function (query) {
    var history = this._sqlModel.getUndoHistory();
    var last = _.last(history);
    return last && last.content && last.content.toLowerCase() === query.toLowerCase();
  },

  _updateVisNotification: function () {
    SQLNotifications.showNotification({
      status: 'success',
      info: _t('notifications.sql.success'),
      closable: true
    });
  },

  _defaultSQL: function () {
    return this._nodeModel.getDefaultQuery();
  },

  _afterAlterDataSuccess: function () {
    var originalQuery = this._defaultSQL();
    this._userActions.saveAnalysisSourceQuery(originalQuery, this._nodeModel, this._layerDefinitionModel);
  },

  _hasAnalysisApplied: function () {
    return this._nodeModel.get('type') !== 'source';
  },

  _onChangeEdition: function () {
    this._infoboxState();

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
        return new ScrollView({
          createContentView: function () {
            return new DataContentView({
              className: 'Editor-content',
              stackLayoutModel: self._stackLayoutModel,
              columnsModel: self._columnsModel,
              queryGeometryModel: self._queryGeometryModel,
              userActions: self._userActions,
              infoboxModel: self._infoboxModel,
              overlayModel: self._overlayModel,
              layerContentModel: self._layerContentModel,
              layerDefinitionModel: self._layerDefinitionModel
            });
          }
        });
      },
      createActionView: function () {
        return new CoreView();
      }
    }, {
      selected: this._editorModel.get('edition'),
      createContentView: function () {
        return new DataSQLView({
          layerDefinitionModel: self._layerDefinitionModel,
          querySchemaModel: self._querySchemaModel,
          codemirrorModel: self._codemirrorModel,
          onApplyEvent: self._parseSQL
        });
      },
      createActionView: function () {
        var isAnalysis = self._hasAnalysisApplied();
        if (!isAnalysis) {
          self._checkClearButton();
          return new UndoButtons({
            trackModel: self._sqlModel,
            editorModel: self._editorModel,
            clearModel: self._clearSQLModel,
            applyStatusModel: self._applyButtonStatusModel,
            applyButton: true,
            clearButton: true,
            onApplyClick: self._parseSQL,
            onClearClick: self._clearSQL.bind(self)
          });
        }
      }
    }];

    this._collectionPane = new TabPaneCollection(tabPaneTabs);
  },

  _confirmReadOnly: function () {
    this._infoboxModel.set({ state: '' });
  },

  _initViews: function () {
    var self = this;

    var infoboxSstates = [
      {
        state: 'readonly',
        createContentView: function () {
          return Infobox.createWithAction({
            type: 'code',
            title: _t('editor.data.messages.sql-readonly.title'),
            body: _t('editor.data.messages.sql-readonly.body'),
            action: {
              label: _t('editor.data.messages.sql-readonly.accept')
            }
          });
        },
        onAction: self._confirmReadOnly.bind(self)
      }, {
        state: 'no-data',
        createContentView: function () {
          return Infobox.createInfo({
            type: 'alert',
            title: _t('editor.data.messages.empty-data.title'),
            body: _t('editor.data.messages.empty-data.body')
          });
        }
      }, {
        state: 'layer-hidden',
        createContentView: function () {
          return Infobox.createWithAction({
            type: 'alert',
            title: _t('editor.messages.layer-hidden.title'),
            body: _t('editor.messages.layer-hidden.body'),
            action: {
              label: _t('editor.messages.layer-hidden.show')
            }
          });
        },
        onAction: self._showHiddenLayer.bind(self)
      }
    ];

    var infoboxCollection = new InfoboxCollection(infoboxSstates);

    var panelWithOptionsView = new PanelWithOptionsView({
      className: 'Editor-content',
      editorModel: self._editorModel,
      infoboxModel: self._infoboxModel,
      infoboxCollection: infoboxCollection,
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

    // TOFIX
    // If there are errors in the SQL, open the sql editor by default
    // we defer it to not interfere with the high order tabpane item selection
    setTimeout(this._redirectIfErrors.bind(this), 0);
  },

  _infoboxState: function () {
    var edition = this._editorModel.get('edition');
    var isAnalysis = this._hasAnalysisApplied();

    if (edition && isAnalysis) {
      this._codemirrorModel.set({ readonly: true });
      this._infoboxModel.set({ state: 'readonly' });
    } else if (this._isLayerHidden()) {
      this._infoboxModel.set({ state: 'layer-hidden' });
      this._overlayModel.set({ visible: true });
    } else {
      this._codemirrorModel.set({ readonly: false });
      this._infoboxModel.set({ state: '' });
      this._overlayModel.set({ visible: false });
    }
  },

  _showHiddenLayer: function () {
    var savingOptions = {
      shouldPreserveAutoStyle: true
    };
    this._layerDefinitionModel.toggleVisible();
    this._userActions.saveLayer(this._layerDefinitionModel, savingOptions);
  },

  _isLayerHidden: function () {
    return this._layerDefinitionModel.get('visible') === false;
  }
});
