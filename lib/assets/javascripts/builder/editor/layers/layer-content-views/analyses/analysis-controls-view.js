var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var Utils = require('builder/helpers/utils');
var InfoboxFactory = require('builder/components/infobox/infobox-factory');
var InfoboxModel = require('builder/components/infobox/infobox-model');
var InfoboxCollection = require('builder/components/infobox/infobox-collection');
var AnalysesQuotaPresenter = require('./analyses-quota/analyses-quota-presenter');
var AnalysesQuotaOptions = require('./analyses-quota/analyses-quota-options');
var AnalysesQuotaProvider = require('./analyses-quota/analyses-quota-provider');
var AnalysesQuotaEstimation = require('./analyses-quota/analyses-quota-estimation-input');
var AnalysesQuotaEnough = require('./analyses-quota/analyses-quota-enough');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var AnalysisButtonsView = require('./analysis-buttons-view');
var AnalysisQuotaView = require('./analysis-quota-view');

var REQUIRED_OPTS = [
  'layerDefinitionModel',
  'analysisFormsCollection',
  'configModel',
  'formModel',
  'quotaInfo',
  'querySchemaModel',
  'stackLayoutModel',
  'userActions',
  'userModel'
];

/**
 * View representing the apply and cancel/delete buttons for a form
 */
module.exports = CoreView.extend({
  module: 'editor:layers:layer-content-views:analyses:analysis-controls-view',

  className: 'Options-bar',

  events: {
    'click .js-save': '_onSaveClicked',
    'click .js-delete': '_onDeleteClicked'
  },

  _buttonsView: null,

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._analysisNode = opts.analysisNode;
    this._analysisFormsCollection = opts.analysisFormsCollection;

    AnalysesQuotaEstimation.init(opts.configModel);
    AnalysesQuotaEnough.init(opts.configModel);

    this._viewModel = new Backbone.Model({
      isNewAnalysis: !opts.analysisNode,
      hasChanges: !opts.analysisNode,
      isDone: true,
      type: this._formModel.get('type')
    });

    this._infoboxModel = new InfoboxModel({
      state: this._quotaInfo.getState(),
      visible: true
    });

    this._initViewState();
    this.render = this.render.bind(this);

    this._initBinds();

    if (!opts.analysisNode) {
      this._fetchQuotaIfNeeded();
    }

    this._onFormModelChanged = this._onFormModelChanged.bind(this);
  },

  render: function () {
    var type, isValid, requiresQuota, view;

    this.clearSubViews();
    this.$el.empty();
    type = this._formModel.get('type');
    isValid = this._formModel.isValid();
    // If no dataservice, requiresQuota returns false because the model doesn't exist and it's converted to boolean
    requiresQuota = AnalysesQuotaOptions.requiresQuota(type, this._quotaInfo);

    if (this._isAnalysisDone() && !this._hasChanges()) {
      view = this._createButtonsView();
    } else {
      // If the analysis doesn't require quota, let's not wait or check the fetching state
      if (!requiresQuota || !isValid) {
        view = this._createButtonsView();
      } else {
        view = this._createQuotaView();
      }
    }

    this.addView(view);
    this.$el.append(view.render().el);
    this._setTrackingClass();

    return this;
  },

  _initViewState: function () {
    this._viewState = new Backbone.Model({
      canBeGeoreferenced: false
    });
    this._setViewState();
  },

  _setTrackingClass: function () {
    this.$('.js-save').addClass('track-' + this._formModel.get('type') + '-analysis track-apply');
  },

  _initBinds: function () {
    this.listenTo(this._formModel, 'change', this._onFormModelChanged);
    if (this._analysisNode) {
      this._bindAnalysisNodeStatusChanges();
    }
    this.listenTo(this._viewState, 'change', this.render);
  },

  _bindAnalysisNodeStatusChanges: function () {
    this.listenTo(this._analysisNode, 'change:status', function () {
      this._viewModel.set('isDone', this._isAnalysisDone());
      var isAnalysisDone = this._isAnalysisDone();
      if (isAnalysisDone) {
        this.render();
      }
    });
  },

  _onFormModelChanged: function () {
    var isAnalysisDone = this._isAnalysisDone();
    var isDone = this._viewModel.get('isNewAnalysis') || isAnalysisDone;
    var canSave = this._formModel.isValid() && isDone;

    this._viewModel.set({
      hasChanges: true,
      type: this._formModel.get('type'),
      isDisabled: !canSave
    });

    this.render();
    this._fetchQuotaIfNeeded();
  },

  _fetchQuotaIfNeeded: function () {
    var type = this._formModel.get('type');
    var isValid = this._formModel.isValid();

    var quota = this._quotaInfo;
    if ((quota.needsCheck() || AnalysesQuotaOptions.requiresQuota(type, quota)) && isValid) {
      this._fetchQuota();
    }
  },

  _fetchQuota: function () {
    this._infoboxModel.set('state', 'fetching');

    this._quotaInfo.fetch({
      success: function () {
        this._buildQuotaViewInfo();
      }.bind(this),
      error: function (error) {
        this._viewModel.set({error: error});
        this._infoboxModel.set('state', 'error');
      }.bind(this)
    });
  },

  _createButtonsView: function () {
    this._viewModel.set({
      labelSave: _t('editor.layers.analysis-form.apply-btn'),
      labelDelete: this._analysisNode
        ? _t('editor.layers.analysis-form.delete-btn')
        : _t('editor.layers.analysis-form.cancel-btn'),
      isDelete: this._analysisNode,
      disableDelete: !this._canDelete(),
      isDisabled: !this._canSave()
    });

    if (this._buttonsView === null) {
      this._buttonsView = new AnalysisButtonsView({
        model: this._viewModel
      });
    }

    return this._buttonsView;
  },

  _buildQuotaViewInfo: function () {
    var formModel = this._formModel;
    var userModel = this._userModel;
    var type = formModel.get('type');
    var service = AnalysesQuotaOptions.getServiceName(type);
    var query = this._querySchemaModel.get('query');
    var quotaData = this._quotaInfo;

    var payload = {};
    payload.type = type;

    var errorCallback = function (error) {
      this._viewModel.set('error', error);
      this._infoboxModel.set('state', 'error');
    }.bind(this);

    var checkEnoughQuota = function (data) {
      // Apply transformation to the input
      // for example isolines takes tracts in in order to calculate estimation
      var rows = AnalysesQuotaOptions.transformInput(type, data, formModel);
      payload.estimation = rows;
      // with the input, we calculate wether the quota is enough
      this.enoughQuotaPromise = AnalysesQuotaEnough.fetch(service, rows);
      return this.enoughQuotaPromise;
    }.bind(this);

    var buildPayload = function (enoughQuota) {
      // then we can get the full set of data
      payload.quotaInfo = AnalysesQuotaProvider(type, userModel, quotaData, enoughQuota);
      payload.creditsLeft = payload.quotaInfo.totalQuota - payload.quotaInfo.usedQuota;
      payload.canRunAnalysis = ((enoughQuota && payload.quotaInfo.totalQuota > 0) ||
                               (payload.quotaInfo.hardLimit === false && payload.quotaInfo.totalQuota > 0));

      // we need to check the request's state because it could be another render while permforming the current one
      // so, to make sure we have all data returned by the apis, we don't raise the green flag until both stats are resolved.
      var estimationState = this.estimationPromise.state();
      var enoughQuotaState = this.enoughQuotaPromise.state();

      if (estimationState === 'resolved' && enoughQuotaState === 'resolved') {
        if (this._infoboxModel.get('state') !== 'ready') {
          this.payload = payload;
          // finally we are ready to show the information
          this._infoboxModel.set('state', 'ready');
        }
      }
    }.bind(this);

    var dsReady = quotaData.isReady();

    // Only checks api if analysis belongs to a service with quota
    if (service !== null && dsReady) {
      if (formModel.isValid()) {
        // get the estimation for this analysis
        this.estimationPromise = AnalysesQuotaEstimation.fetch(query);

        this.estimationPromise
          .then(checkEnoughQuota, errorCallback)
          .then(buildPayload, errorCallback);
      } else {
        // to render the simple buttons view.
        this.render();
      }
    } else if (!dsReady) {
      errorCallback(_t('editor.layers.analysis-form.quota.quota-dataservice-down'));
    }
  },

  _createQuotaView: function () {
    var states = [
      {
        state: 'fetching',
        createContentView: function () {
          return InfoboxFactory.createLoading({
            body: _t('editor.layers.analysis-form.quota.loading')
          });
        }
      },
      {
        state: 'ready',
        createContentView: function () {
          var payload = this.payload;
          var confirmLabel = _t('editor.layers.analysis-form.confirm-analysis');
          var quotaMessage = '';

          if (payload.creditsLeft > 0) {
            quotaMessage = _t('editor.layers.analysis-form.quota.credits-left-message', {
              smart_count: Utils.formatNumber(payload.creditsLeft)
            });
          } else {
            quotaMessage = _t('editor.layers.analysis-form.quota.no-credits-message');
          }
          payload.quotaInfo.quotaMessage = quotaMessage;

          var dataInfobox = _.extend(AnalysesQuotaPresenter.make(payload, this._configModel, this._userModel), {
            title: _t('editor.layers.analysis-form.quota.title'),
            mainAction: {
              label: confirmLabel,
              type: 'primary',
              disabled: !this._canSave() || !payload.canRunAnalysis
            },
            quota: payload.quotaInfo,
            closable: false
          });

          return InfoboxFactory.createQuota(dataInfobox);
        }.bind(this),
        mainAction: function () {
          var payload = this.payload;
          if (this._canSave() && payload.canRunAnalysis) {
            this._saveAnalysis();
          }
        }.bind(this)
      },
      {
        state: 'error',
        createContentView: function () {
          return InfoboxFactory.createWithAction({
            title: _t('editor.layers.analysis-form.quota.title'),
            type: 'error',
            body: _t('editor.layers.analysis-form.quota.quota-fetch-error', {
              error: this._viewModel.get('error')
            }),
            mainAction: {
              label: _t('editor.layers.analysis-form.quota.cancel')
            }
          });
        }.bind(this),
        mainAction: function () {
          this._stackLayoutModel.prevStep('layers');
        }.bind(this)
      }
    ];

    return new AnalysisQuotaView({
      className: 'Infobox-wrapper',
      infoboxModel: this._infoboxModel,
      infoboxCollection: new InfoboxCollection(states)
    });
  },

  _canSave: function () {
    var isAnalysisDone = this._isAnalysisDone();
    var isDone = this._viewModel.get('isNewAnalysis') || isAnalysisDone;
    var hasChanges = this._viewModel.get('hasChanges');
    return this._formModel.isValid() && isDone && hasChanges;
  },

  _onSaveClicked: function () {
    if (this._canSave()) {
      this._saveAnalysis();
    }
  },

  _canDelete: function () {
    var nodeDefModel = this._analysisNode;
    var canDeleteNode = (!nodeDefModel || nodeDefModel.canBeDeletedByUser());
    var canBeGeoreferenced = this._viewState.get('canBeGeoreferenced');
    var hasAnalyses = this._layerDefinitionModel.hasAnalyses();

    return (hasAnalyses && canDeleteNode) || (canDeleteNode && !canBeGeoreferenced);
  },

  _onDeleteClicked: function () {
    if (this._canDelete()) {
      this._deleteAnalysis();
    }
  },

  _hasChanges: function () {
    return this._viewModel.get('hasChanges') === true;
  },

  _isAnalysisDone: function () {
    return this._analysisNode && (this._analysisNode.isDone() || this._analysisNode.hasFailed());
  },

  _saveAnalysis: function () {
    this._infoboxModel.set('state', 'idle');
    var newNode = this._userActions.saveAnalysis(this._formModel);

    if (!this._analysisNode) {
      this._analysisNode = newNode;
      this._bindAnalysisNodeStatusChanges();
    }

    // For cached analysis, if the user edits the analysis to a previous version of it
    // the request returns the status:ready but the analysis node already has this state
    // so no changes are triggered
    this._analysisNode.set({ status: 'launched' }, { silent: true });

    this._viewModel.set({ hasChanges: false, isDone: false });
    this.render();
  },

  _deleteAnalysis: function () {
    this._analysisFormsCollection.deleteNode(this._formModel.get('id'));
  },

  _setViewState: function () {
    return this._layerDefinitionModel.canBeGeoreferenced()
      .then(function (canBeGeoreferenced) {
        this._viewState.set('canBeGeoreferenced', canBeGeoreferenced);
      }.bind(this));
  }
});
